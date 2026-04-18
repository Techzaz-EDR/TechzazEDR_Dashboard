import traceback
from app.core.config import settings
from cryptography.hazmat.primitives import serialization

key = settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n')
print('KEY length:', len(key))
print('KEY start:', repr(key[:30]))
print('KEY end:', repr(key[-30:]))

try:
    serialization.load_pem_private_key(key.encode('utf-8'), password=None)
    print('Success!')
except Exception as e:
    print(e.__class__.__name__)
    traceback.print_exc()
