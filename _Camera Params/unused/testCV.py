import cv2

fourcc = cv2.VideoWriter_fourcc(*'MJPG')

# Open the default camera
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FOURCC, fourcc)
cap.set(cv2.CAP_PROP_FPS, 30.0)

# Define the codec and create a VideoWriter object
format = cap.get(cv2.CAP_PROP_FOURCC)
fps = cap.get(cv2.CAP_PROP_FPS)
print(f"Format: {format}, FPS: {fps}")
# For some reason, the fps only reaches 99 instead of 120
out = cv2.VideoWriter('video.avi', fourcc, 99, (640, 480))

while True:
    # Read the current frame
    ret, frame = cap.read()

    # Write the frame to the output file
    out.write(frame)

    # Display the frame
    cv2.imshow('Frame', frame)

    # Wait for keypress
    key = cv2.waitKey(1) & 0xFF

    # Check if 'q' key is pressed
    if key == ord('q'):
        break

# Release the VideoWriter and close all windows
# Release the camera and close all windows
out.release()
cap.release()
cv2.destroyAllWindows()