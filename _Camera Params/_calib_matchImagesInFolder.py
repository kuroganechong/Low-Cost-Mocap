# 3. After manually checking valid checkerboard images in images/out, manually delete the invalid ones
# Then, run this code to copy the valid ones to images/sorted.

import os
import shutil

out_folder = 'images/out'
raw_folder = 'images/raw'
sorted_folder = 'images/sorted'

# Create matching subfolders in images/sorted
for subfolder in os.listdir(out_folder):
    subfolder_path = os.path.join(sorted_folder, subfolder)
    os.makedirs(subfolder_path, exist_ok=True)

    # Get list of filenames in the current subfolder
    filenames = os.listdir(os.path.join(out_folder, subfolder))

    # Copy matching files from images/raw to images/sorted
    for filename in filenames:
        raw_file = os.path.join(raw_folder, filename)
        sorted_file = os.path.join(subfolder_path, filename)
        shutil.copy(raw_file, sorted_file)