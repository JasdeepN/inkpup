import os
import requests

api_token = os.environ.get("R2_API_TOKEN")
account_id = os.environ.get("CF_ACCOUNT_ID")

print('api_token:', api_token)
print('account_id:', account_id)
print('url:', f"https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/access_keys")

headers = {
    "Authorization": f"Bearer {api_token}",
    "Content-Type": "application/json",
}

resp = requests.get(
    f"https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/access_keys",
    headers=headers,
)
print('status:', resp.status_code)
print('response:', resp.text)
resp.raise_for_status()
result = resp.json()
print('result:', result)
if "result" in result and "access_keys" in result["result"]:
    keys = result["result"]["access_keys"][0]
    print('Access Key ID:', keys['access_key_id'])
    print('Secret Access Key:', keys['secret_access_key'])
else:
    print('No access keys found.')
