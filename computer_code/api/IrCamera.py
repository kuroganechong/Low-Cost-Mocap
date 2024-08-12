import cv2 as cv

class IrCamera:
    def __init__(self, resolution=None, fps=None, gain=None, exposure=None):
        self.ids, self.cameras = self.autoscan_cameras()
        self.resolution = resolution
        self.fps = fps
        self.gain = gain
        self.exposure = exposure
                
        # Set pixel format to MJPG
        for i in range(len(self.ids)):
            self.cameras[i].set(cv.CAP_PROP_FOURCC, cv.VideoWriter_fourcc(*'MJPG'))
        
        if self.resolution is not None:
            # Check if resolution matches predefined formats
            resolutions = [(320, 240), (640, 480), (800, 600), (1024, 768), (1280, 720), (1280, 1024), (1920, 1080)]
            if self.resolution not in resolutions:
                raise ValueError("Invalid resolution. Please choose from ", resolutions)
            
            for i in range(len(self.ids)):
                self.cameras[i].set(cv.CAP_PROP_FRAME_WIDTH, self.resolution[0])
            
            for i in range(len(self.ids)):
                self.cameras[i].set(cv.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
        
        if self.fps is not None:
            for i in range(len(self.ids)):
                self.cameras[i].set(cv.CAP_PROP_FPS, self.fps)
        
        if self.gain is not None:
            for i in range(len(self.ids)):
                self.cameras[i].set(cv.CAP_PROP_GAIN, self.gain)
        
        if self.exposure is not None:
            for i in range(len(self.ids)):
                self.cameras[i].set(cv.CAP_PROP_EXPOSURE, self.exposure)

    def autoscan_cameras(self):
        """Autoscan and connect cameras. Return camera ids"""
        ids = []
        cameras = []
        for i in range(10):
            cap = cv.VideoCapture(i)
            if cap.isOpened():
                ids.append(i)
                cameras.append(cap)
            else:
                cap.release()

        return ids, cameras

    # Mimic pseyepy Camera class
    def read(self, idx=None):
        """Read camera frame/s
        
        Parameters
        ----------
        idx : int or None
            Index of camera to read from. If None, read from all cameras.

        Returns
        -------
        list of frames or frame per camera
        """
        if idx is None:
            idx = list(range(len(self.ids)))

        imgs = [None for i in idx]

        for j, i in enumerate(idx):
            _id = self.ids[i]

            ret, frame = self.cameras[i].read()
            if ret:
                imgs[i] = frame
                # cv.imshow('{}'.format(i), frame)
                # key = cv.waitKey(1) & 0xFF
            else:
                print("Error reading frame from camera {}".format(_id))
                continue
        
        return imgs

    def set_exposure(self, exposure):
        """Set exposure of camera/s"""
        for i in range(len(self.ids)):
            self.cameras[i].set(cv.CAP_PROP_EXPOSURE, exposure)

    def set_gain(self, gain):
        """Set gain of camera/s"""
        for i in range(len(self.ids)):
            self.cameras[i].set(cv.CAP_PROP_GAIN, gain)


# Test
# camera = IrCamera((320, 240), 120)
# while True:
#     frame = camera.read()
#     print("\rRead {} frames".format(len(frame)), end="")
