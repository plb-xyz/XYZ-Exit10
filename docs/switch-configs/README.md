# Exit10 Aruba Switch Configurations

This folder contains one per-switch Aruba AOS-CX configuration document for the Exit10 network.

## Out-of-Box Initial Setup (run first)

1. Physical serial cable → PuTTY (Serial, COM4, 9600)
        ↓
2. Login: admin / (blank)
        ↓
3. Paste Step 1 initial config → write memory
        ↓
4. Unplug serial cable
        ↓
5. SSH admin@10.154.10.XX  ← all future config via network
        ↓
6. Web UI: https://10.154.10.XX  ← or upload .cfg via Config Mgmt page

Every switch file includes **Step 1 — Initial Setup**. Run Step 1 first from:

1. Serial console connection (recommended — see [Windows 11 USB-C Serial Connection](#windows-11-usb-c-serial-connection) below), or
2. Factory default web UI.

### Windows 11 USB-C Serial Connection

The Aruba CX 6300 series has a **USB-C console port** on the front panel.

**1 — Install the driver**

Windows 11 may auto-install the driver. If the port does not appear in Device Manager:

- Download and install the **Silicon Labs CP210x VCP driver** from:
  `https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers`
- After installing, reconnect the USB-C cable. A new **COMx** port appears under *Ports (COM & LPT)* in Device Manager.

**2 — Find the COM port number**

1. Press `Win + X` → *Device Manager*
2. Expand **Ports (COM & LPT)**
3. Note the number shown next to *Silicon Labs CP210x USB to UART Bridge* — for example `COM3`

**3 — Open a terminal (PuTTY — recommended)**

Download PuTTY from `https://www.putty.org` if not already installed.

Settings:

| Field | Value |
|---|---|
| Connection type | Serial |
| Serial line | `COM3` (use the number found in step 2) |
| Speed (baud) | `9600` |
| Data bits | `8` |
| Stop bits | `1` |
| Parity | None |
| Flow control | None |

Click **Open**. Press **Enter** if the screen is blank. The switch login prompt appears.

**4 — Alternative: Windows Terminal / PowerShell**

```powershell
# Replace COM3 with your actual COM port
mode COM3 BAUD=9600 PARITY=n DATA=8 STOP=1
# Then open a serial session with PuTTY or:
plink -serial COM3 -sercfg 9600,8,n,1,N
```

**5 — Log in**

```
Login: admin
Password: (press Enter — blank by default)
```

You are now at the AOS-CX prompt. Run the **Step 1 — Initial Setup** commands from the per-switch file.

Default credentials are:

- Username: `admin`
- Password: *(blank / no password)*

Step 1 sets the production admin credential:

- Username: `admin`
- Password: `Exit10-2026!`

After Step 1 completes, web UI is available at:

- `https://10.154.10.20` (AVR-08-SFP-01)
- `https://10.154.10.21` (AVR-01-SWE-01)
- `https://10.154.10.22` (AVR-02-SWE-01)
- `https://10.154.10.23` (AVR-03-SWE-01)
- `https://10.154.10.24` (AVR-04-SWE-01)
- `https://10.154.10.25` (AVR-05-SWE-01)
- `https://10.154.10.27` (AVR-07-SWE-01)
- `https://10.154.10.28` (AVR-08-SWE-01)
- `https://10.154.10.30` (AVR-10-SWE-01)

## Network and Protocol Standards

- Firmware target: **AOS-CX 10.13/10.14**
- Control VLAN subnet: `10.154.10.0/24`
- Gateway: `10.154.10.1`
- Trunks carry VLANs **10, 20, 30, 40** (`vlan trunk allowed all` + `vlan trunk native 10`)
- VLAN 30 (Dante): `no ip igmp snooping`, no querier
- VLAN 40 (sACN): IGMP snooping + querier enabled
- SNMP is enabled during Step 1 for ISAAC integration

### Dante note (Audinate requirement)

On every VLAN 30 Dante port:

- `no eee` is set to disable Energy Efficient Ethernet (IEEE 802.3az)
- `qos trust dscp` is set on the interface (port-level trust for Dante only)
- QoS DSCP mappings are configured for CS7/EF/CS1 priorities

## Switch Files

| Hostname | IP | Model | Location | Config File |
|---|---|---|---|---|
| AVR-08-SFP-01 | 10.154.10.20 | CX 6300M 24P SFP (JL658A) | EER — Core Fiber | [AVR-08-SFP-01.md](./AVR-08-SFP-01.md) |
| AVR-01-SWE-01 | 10.154.10.21 | CX 6300F 24P (JL666A) | IDF-FF-03A | [AVR-01-SWE-01.md](./AVR-01-SWE-01.md) |
| AVR-02-SWE-01 | 10.154.10.22 | CX 6300F 48P (JL665A) | IDF-GF-06 | [AVR-02-SWE-01.md](./AVR-02-SWE-01.md) |
| AVR-03-SWE-01 | 10.154.10.23 | CX 6300F 24P (JL666A) | IDF-FF-08 | [AVR-03-SWE-01.md](./AVR-03-SWE-01.md) |
| AVR-04-SWE-01 | 10.154.10.24 | CX 6300F 24P (JL666A) | IDF-GF-P1 | [AVR-04-SWE-01.md](./AVR-04-SWE-01.md) |
| AVR-05-SWE-01 | 10.154.10.25 | CX 6300F 24P (JL666A) | IDF-GF-P2 | [AVR-05-SWE-01.md](./AVR-05-SWE-01.md) |
| AVR-07-SWE-01 | 10.154.10.27 | CX 6300F 48P (JL665A) | EER | [AVR-07-SWE-01.md](./AVR-07-SWE-01.md) |
| AVR-08-SWE-01 | 10.154.10.28 | CX 6300F 48P (JL665A) | EER | [AVR-08-SWE-01.md](./AVR-08-SWE-01.md) |
| AVR-10-SWE-01 | 10.154.10.30 | CX 6300F 48P (JL665A) | EER | [AVR-10-SWE-01.md](./AVR-10-SWE-01.md) |

> Note: Landlord network is implemented as VLAN 50 (`Landlord`) on the designated ports.
