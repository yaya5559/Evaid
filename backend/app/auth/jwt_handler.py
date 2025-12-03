import jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
import app.database

SECRET_KEY = "29640ffbf5251fcafd1066268304879a62dcd61be7176245b563203901cec5c3"
ALGORITHM = "HS256" 
ACCESS_TOKEN_EXPIRE_MINUTES = 30


password_has = PasswordHash.recommended()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
   return password_hash.verify(plain_password, hashed_password)

def get_password_hash(password):
   return password_hash.hash(password)

def get_user(db, username: str):
  if username in db:
     user_dict = db[username]
     return UserInDB(**user_dict)

def authenticate_user(fake_db, username: str, password: str):
   user = get_user(fake_db, username)
   if not user:
      return False
   if not verify_password(password, user.hashed_password):
      return False
   return user

def create_access_token(data: dict, expires_deltaL: timedelta or None = None):
  to_encode = data.copy()
  if expires_delta:
    expire = datetime.utcnow() + expires_delta
  else:
      expire = datatime.utcnow() + timedelta(minutes=15)

  to_encode.update({"exp": expire})
  encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
  return encoded_jwt



