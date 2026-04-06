import os
import logging
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

if SUPABASE_URL and SUPABASE_KEY:
    jwks_url = f"{SUPABASE_URL}/auth/v1/jwks"
    jwks_client = PyJWKClient(jwks_url, headers={"apikey": SUPABASE_KEY})
else:
    jwks_client = None

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the Supabase JWT token received from frontend requests.
    Supports both legacy HS256 shared secrets AND modern ECC P-256 asymmetric keys
    by dynamically fetching the public JWKS from Supabase.
    """
    token = credentials.credentials

    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")

        # If it's the legacy shared secret, verify it locally
        if alg == "HS256":
            if not SUPABASE_JWT_SECRET:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Missing SUPABASE_JWT_SECRET for legacy HS256 tokens."
                )
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # For modern ECC P-256 / RS256, fetch the public key directly from Supabase
            if not jwks_client:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Missing SUPABASE_URL or SUPABASE_KEY. Token verification blocked."
                )
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256", "ES256", "PS256"],
                options={"verify_aud": False},
            )
            
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        log.error(f"Token validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
