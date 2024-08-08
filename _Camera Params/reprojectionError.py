import cv2
import numpy as np

chessboard_size = (9, 6)

criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)

objp = np.zeros((6*9,3), np.float32)
objp[:,:2] = np.mgrid[0:9,0:6].T.reshape(-1,2)

objpoints = [objp] # 3d points in real world space
imgpoints = [] # 2d points in image plane.

# Load the image
image = cv2.imread('940nmIRcameraCalib1.jpg')

# Convert the frame to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
# Find chessboard corners
ret, corners = cv2.findChessboardCorners(gray, chessboard_size, None)
corners2 = cv2.cornerSubPix(gray, corners, (11, 11), (-1, -1), criteria)
imgpoints.append(corners2)

# Load camera matrix and distortion coefficients from CSV
camera_matrix = np.genfromtxt('camera_matrix.csv', delimiter=',')
camera_matrix = camera_matrix.reshape(camera_matrix.shape[0], 3, 3)
dist = np.genfromtxt('dist.csv', delimiter=',')
rvecs = np.genfromtxt('rvecs.csv', delimiter=',')
tvecs = np.genfromtxt('tvecs.csv', delimiter=',')

errors = []

for i in range(camera_matrix.shape[0]):
    undistorted_image = cv2.undistort(image, camera_matrix[i], dist[i])
    cv2.imshow("Undistorted Image_{}".format(i), undistorted_image)
    imgpoints2, _ = cv2.projectPoints(objpoints[0], rvecs[i], tvecs[i], camera_matrix[i], dist[i])
    error = cv2.norm(imgpoints[0], imgpoints2, cv2.NORM_L2)/len(imgpoints2)
    print(error)
    errors.append(error)

mean_error = np.mean(error)
print( "mean error: {}".format(mean_error/len(objpoints)) )

# Break the loop if 'q' is pressed
if cv2.waitKey(0) & 0xFF == ord('q'):
    cv2.destroyAllWindows()
