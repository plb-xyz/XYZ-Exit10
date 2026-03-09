# Protocol Reference

This document outlines the communication protocols essential for various systems.

## 1. OSC for QSC Audio
### Overview
Open Sound Control (OSC) is a protocol used for communications between audio devices and computer systems, particularly in live audio environments.

### Implementation
- Use OSC messages for control and feedback.
- Specific OSC message formats should comply with QSC Audio standards.

## 2. sACN for GrandMA Lighting
### Overview
Streaming Architecture for Control Networks (sACN) is an open standard protocol for streaming DMX over IP networks.

### Implementation
- Use sACN to control lighting fixtures in real time.
- Ensure compatibility with GrandMA console systems.

## 3. Timecode Distribution from Watchout
### Overview
Timecode is a synchronization standard used to align video playback.

### Implementation
- Use SMPTE timecode provided by Watchout for synchronizing multiple devices.

## 4. HTTP/TCP/UDP for Various Devices
### Overview
These protocols are foundational for network communication between devices.

### Usage
- HTTP: Used for web-based interfaces.
- TCP: Connection-oriented protocol ensuring reliable data transfer.
- UDP: Connectionless protocol useful for time-sensitive applications.

## 5. Dante for Audio
### Overview
Dante is a popular audio networking technology that transmits high-quality audio over IP networks.

### Implementation
- Use Dante for audio routing in large scale audio networks.
- Ensure devices are Dante-enabled for seamless integration.

## 6. Modbus for Building Systems
### Overview
Modbus is a communication protocol used in industrial automation systems.

### Implementation
- Use Modbus for communication between building management systems and devices.
- Support both Modbus TCP and Modbus RTU formats.

---
Provide detailed configurations and examples for each protocol as needed.