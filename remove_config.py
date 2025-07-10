import shutil
import os

appdata_path = os.environ.get('APPDATA')
if appdata_path:
    config_dir = os.path.join(appdata_path, 'EasyTranscribe')
    if os.path.exists(config_dir):
        shutil.rmtree(config_dir, ignore_errors=True)
        print(f"Removed: {config_dir}")
    else:
        print(f"Directory not found: {config_dir}")
else:
    print("APPDATA environment variable not found.")