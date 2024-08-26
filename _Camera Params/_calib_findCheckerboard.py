# 2. Find the checkerboard in the images and draw the corners

import os
import cv2

# Define the paths
input_folder = 'images/raw/'
output_folder = 'images/out/'

chessboard_size = (9, 6)
criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)

# Create the output folder if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

# Loop through each image in the input folder
for filename in os.listdir(input_folder):
    if filename.endswith('.jpg') or filename.endswith('.png'):
        # Get the id of the image
        image_id = int(filename.split('.')[0].split('_id')[-1])
        # Load the image
        image_path = os.path.join(input_folder, filename)
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)

        # Find the checkerboard
        found, corners = cv2.findChessboardCorners(gray, chessboard_size, cv2.CALIB_CB_ADAPTIVE_THRESH + cv2.CALIB_CB_NORMALIZE_IMAGE)

        if found:
            # Refine the corner locations
            corners2 = cv2.cornerSubPix(gray, corners, (11, 11), (-1, -1), criteria)
            image = cv2.drawChessboardCorners(image, chessboard_size, corners2, found)

            # Save the image with the corners drawn
            # Store the image into a subfolder named image_id
            subfolder = os.path.join(output_folder, str(image_id))
            os.makedirs(subfolder, exist_ok=True)
            output_path = os.path.join(subfolder, filename)
            cv2.imwrite(output_path, image)
        else:
            # Move the image to the subfolder
            subfolder = os.path.join(input_folder, 'no_checkerboard')
            os.makedirs(subfolder, exist_ok=True)
            new_path = os.path.join(subfolder, filename)
            os.rename(image_path, new_path)