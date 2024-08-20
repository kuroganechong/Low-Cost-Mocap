import cv2

# Open the default camera
cap = cv2.VideoCapture(6)
cap.set(cv2.CAP_PROP_CODEC_PIXEL_FORMAT, 0)
cap.set(cv2.CAP_PROP_FPS, 120)

while True:
    # Read the current frame
    ret, frame = cap.read()

    # Display the frame
    cv2.imshow('Frame', frame)

    # Wait for keypress
    key = cv2.waitKey(1) & 0xFF

    # Check if 'q' key is pressed
    if key == ord('q'):
        # Save the frame as an image
        cv2.imwrite('940nmIRcameraCalib.jpg', frame)
        break

# Release the camera and close all windows
cap.release()
cv2.destroyAllWindows()