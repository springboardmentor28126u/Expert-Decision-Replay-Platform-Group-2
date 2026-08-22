from app.security import hash_password, verify_password

password = "admin123"

hashed = hash_password(password)

print("Original Password :", password)
print("Hashed Password   :", hashed)

print("Verification :", verify_password(password, hashed))