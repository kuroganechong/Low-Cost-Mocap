import cv2
import numpy as np
import glob

cam_images_folder_name = 'images/sorted/0'
chessboard_size = (9, 6)

criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)

objp = np.zeros((6*9,3), np.float32)
objp[:,:2] = np.mgrid[0:9,0:6].T.reshape(-1,2)

objpoints = [objp] # 3d points in real world space
imgpoints = [] # 2d points in image plane.

# Load camera matrix and distortion coefficients
camera_matrix = np.array([[664.890534731518, 0.0, 302.9338502273855], [0.0, 666.5403901968377, 224.18774783379098], [0.0, 0.0, 1.0]])
dist = np.array([0.08326841087011033, -0.2904054172997265, -0.0035338502486490786, -0.019334802746961057, 1.4882745371155794])
rvecs = np.eye(3,3)
tvecs = np.array([0,0,0])

# Load the image
filenames = glob.glob(f'./{cam_images_folder_name}/*.jpg')
errors = []

for filename in filenames:
    image = cv2.imread(filename)

    # Convert the frame to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Find chessboard corners
    ret, corners = cv2.findChessboardCorners(gray, chessboard_size, None)
    corners2 = cv2.cornerSubPix(gray, corners, (11, 11), (-1, -1), criteria)
    imgpoints.append(corners2)

    undistorted_image = cv2.undistort(image, camera_matrix, dist)
    cv2.imshow("Undistorted Image", undistorted_image)
    imgpoints2, _ = cv2.projectPoints(objpoints[0], rvecs, tvecs, camera_matrix, dist)
    error = cv2.norm(imgpoints[0], imgpoints2, cv2.NORM_L2)/len(imgpoints2)
    errors.append(error)

mean_error = np.mean(error)
print( "mean error: {}".format(mean_error/len(objpoints)) )
min_error_index = np.argmin(errors)
print("Index of minimum error:", min_error_index)

# Break the loop if 'q' is pressed
if cv2.waitKey(0) & 0xFF == ord('q'):
    cv2.destroyAllWindows()
