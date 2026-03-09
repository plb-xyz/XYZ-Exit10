# System Architecture

## Overview
This document outlines the architecture of the system, emphasizing the integration of various components and workflows.

## Components

### Master Clock (Watchout)
The Master Clock, based on Watchout, serves as the central time source for the entire system. It ensures synchronization across all nodes and processes involved in the operation.

### Timecode Distribution
Timecode distribution is managed through a robust network that ensures accurate and timely delivery of timecode signals to all connected devices and systems.

### Node-RED Decision Brain
Node-RED is employed as the decision brain, routing commands and data to various systems:
- **GrandMA**: A lighting control system that receives event and cue triggers.
- **Q-Sys**: Audio-visual control system, managing audio routes and settings based on triggers from Node-RED.
- **Pharos**: Lighting control, managing DMX output for lighting fixtures.
- **External Systems**: Various external systems that require integration, allowing control and automation based on the incoming data from Node-RED.

## Workflow
The workflow begins with Watchout generating the master time. This is then distributed through the network (timecode distribution) to all connected systems. Node-RED, with its decision-making capabilities, processes incoming requests and manages communications with GrandMA, Q-Sys, and Pharos, creating a cohesive and responsive ecosystem across all devices.

## Conclusion
This architecture enables efficient management and coordination of various systems, providing a responsive and synchronized environment for performance and production needs.