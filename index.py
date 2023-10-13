import cv2
import time
from pyzbar.pyzbar import decode

# Create a VideoCapture object for your camera (0 for the default camera)
cap = cv2.VideoCapture("http://192.168.24.143:81/stream")

# Initialize a set to keep track of detected QR codes
detected_qr_codes = set()

# Initialize a dictionary to store the timestamp of detected QR codes
qr_code_timestamps = {}

while True:
    ret, frame = cap.read()

    if not ret:
        continue

    # Decode QR codes in the frame
    decoded_objects = decode(frame)

    current_time = time.time()  # Record the current time

    for obj in decoded_objects:
        # Extract QR code data
        qr_data = obj.data.decode('utf-8')

        # Check if this QR code has not been detected before
        if qr_data not in detected_qr_codes:
            print(f"QR Code Data: {qr_data}")

            # Add the QR code to the set and store its timestamp in the dictionary
            detected_qr_codes.add(qr_data)
            qr_code_timestamps[qr_data] = current_time

    # Remove QR codes from memory if they have been detected for over 5 minutes
    for qr_data, timestamp in list(qr_code_timestamps.items()):
        if current_time - timestamp > 300:  # 300 seconds = 5 minutes
            detected_qr_codes.remove(qr_data)
            del qr_code_timestamps[qr_data]

    cv2.imshow('QR Code Scanner', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
