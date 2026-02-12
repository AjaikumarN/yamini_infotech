from database import SessionLocal
import models

db = SessionLocal()
user = db.query(models.User).filter(models.User.username == 'admin').first()
print('user:', user.username)
print('hashed_password length:', len(user.hashed_password))
print('hashed_password (prefix):', user.hashed_password[:60])
print('raw:', user.hashed_password)
