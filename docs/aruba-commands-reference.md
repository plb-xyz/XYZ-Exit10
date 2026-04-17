# Aruba AOS-CX 10.13/10.14 CLI Reference (Exit10 Show Control)

Focused command reference for Aruba 6300/6400 switches used in the Exit10 show-control network.

## Exit10 Network Context

- Show-control subnet: `10.154.10.0/24`
- Watchout Production: `10.154.10.141-142`
- Watchout Display: `10.154.10.151-159`
- Q-Sys Core: `10.154.10.203-204`
- iDRAC management also lives in this network range
- Lighting traffic: sACN multicast (`UDP/5568`) and/or Art-Net broadcast (`UDP/6454`)

> Exit10 note: shows run in sync globally, lighting is always routed through MA, and multicast/broadcast delivery must be reliable to all relevant endpoints.

## Switch Inventory — Exit10

| Hostname | Type | Model | Part # | Location | VLAN | IP (Control) |
|---|---|---|---|---|---|---|
| AVR-08-SFP-01 | **Core Switch** | CX 6300M 24P SFP | JL658A | EER — Core Fiber | Control | 10.154.10.20 |
| AVR-01-SWE-01 | Network Switch | CX 6300F 24P | JL666A | IDF-FF-03A | Control | 10.154.10.21 |
| AVR-02-SWE-01 | Network Switch | CX 6300F 48P | JL665A | IDF-GF-06 | Control | 10.154.10.22 |
| AVR-03-SWE-01 | Network Switch | CX 6300F 24P | JL666A | IDF-FF-08 | Control | 10.154.10.23 |
| AVR-04-SWE-01 | Network Switch | CX 6300F 24P | JL666A | IDF-GF-P1 | Control | 10.154.10.24 |
| AVR-05-SWE-01 | Network Switch | CX 6300F 24P | JL666A | IDF-GF-P2 | Control | 10.154.10.25 |
| AVR-07-SWE-01 | Network Switch | CX 6300F 48P | JL665A | EER | Control | 10.154.10.27 |
| AVR-08-SWE-01 | Network Switch | CX 6300F 48P | JL665A | EER | Control | 10.154.10.28 |
| AVR-10-SWE-01 | Network Switch | CX 6300F 48P | JL665A | EER | Control | 10.154.10.30 |

- All switches are **Aruba AOS-CX**, firmware **10.13/10.14**
- Management access via SSH or web UI on the Control VLAN (`10.154.10.x`)
- `AVR-08-SFP-01` is the **core/uplink switch** (CX 6300M)
- To SSH into a switch, use the exact control IP shown above (for example: `ssh admin@10.154.10.20`)

## VLAN Assignments

| VLAN / Mode | Purpose | AOS-CX Usage |
|---|---|---|
| VLAN 10 (Control) | Switch management + control endpoints | `vlan access 10` |
| VLAN 20 (QLAN) | Q-LAN / audio-control devices | `vlan access 20` |
| VLAN 30 (Dante) | Dante audio network | `vlan access 30` |
| VLAN 40 (sACN-Lighting) | Lighting/sACN multicast transport | `vlan access 40` + IGMP snooping querier on VLAN 40 |
| Trunk | Inter-switch uplinks | `vlan trunk allowed all` + `vlan trunk native 10` |
| Landlord | Landlord-facing ports (placeholder) | `vlan access 1` (verify final VLAN ID with landlord network team) |

See [`docs/switch-configs/`](./switch-configs/) for complete per-switch port tables and full CLI configuration blocks.

## Initial Switch Setup (Out of Box)

Run this once on each brand-new switch before applying the main configuration.

### Connecting via Serial Console (Windows 11 + USB-C)

The Aruba CX 6300 series has a **USB-C console port** on the front panel. Use a USB-C to USB-A (or USB-C to USB-C) cable from your Windows 11 laptop.

**Step A — Install the driver**

Windows 11 often auto-installs the driver. If no COM port appears in Device Manager, install the **Silicon Labs CP210x VCP driver**:
`https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers`

After installing, reconnect the cable. A **COMx** entry appears under *Ports (COM & LPT)* in Device Manager.

**Step B — Find the COM port**

1. Press `Win + X` → *Device Manager*
2. Expand **Ports (COM & LPT)**
3. Note the number next to *Silicon Labs CP210x USB to UART Bridge* (e.g. `COM3`)

**Step C — Open PuTTY**

Download PuTTY from `https://www.putty.org` if needed.

| PuTTY field | Value |
|---|---|
| Connection type | Serial |
| Serial line | `COM3` (or your actual COM number) |
| Speed | `9600` |
| Data bits | `8` |
| Stop bits | `1` |
| Parity | None |
| Flow control | None |

Click **Open**. Press **Enter** if the screen is blank. The AOS-CX login prompt appears.

**Step D — Log in with factory defaults**

```
Login: admin
Password: (press Enter — blank)
```

---

**Full procedure:**

1. Connect via serial console (see above) or factory default web UI.
2. Log in with factory default credentials (`admin` / blank password).
3. Apply the initial setup commands below.
4. Save (`write memory`), then continue with the switch-specific **Step 2 — Main Configuration** in `docs/switch-configs/<HOSTNAME>.md`.

```text
configure terminal

  hostname <HOSTNAME>

  user admin group administrators password plaintext Exit10-2026!

  https-server vrf default
  https-server rest access-mode read-write
  ssh server vrf default
  snmp-server vrf default

  interface vlan 10
    ip address <SWITCH_IP>/24
    no shutdown

  ip route 0.0.0.0/0 10.154.10.1

end

write memory
```

Use the per-switch files in [`docs/switch-configs/`](./switch-configs/) for the exact `<HOSTNAME>` and `<SWITCH_IP>` values.

## 1) Basic navigation & modes

```text
enable
! Enter privileged mode

configure terminal
! Enter global config mode

exit
! Leave current mode (go one level up)

end
! Return directly to privileged EXEC mode

show running-config
! Show active (in-memory) config

show version
! Show switch model/firmware details

write memory
! Save running config to startup config

copy running-config startup-config
! Equivalent save command
```

## 2) Interface configuration

### Access port (single VLAN)

```text
configure terminal
interface 1/1/1
 description LED Node - Gondola 01
 no shutdown
 vlan access 10
 speed auto
 duplex auto
! Access port carries one untagged VLAN
```

### Trunk port (multiple tagged VLANs)

```text
configure terminal
interface 1/1/48
 description Uplink to show backbone
 no shutdown
 vlan trunk native 10
 vlan trunk allowed 10,20,30
 speed auto
 duplex auto
! Tagged trunk carrying multiple VLANs
```

### Verify interface

```text
show interface 1/1/1
! Check link/admin state, speed/duplex, errors
```

## 3) VLAN configuration

```text
configure terminal
vlan 10
 name SHOW_CONTROL
! Create show-control VLAN

vlan 20
 name AUX_SERVICES
! Example secondary VLAN

interface 1/1/1
 vlan access 10
! Assign access interface to VLAN 10

interface 1/1/48
 vlan trunk allowed 10,20
! Allow VLANs on trunk
```

```text
show vlan
! Verify VLAN existence and membership
```

## 4) IGMP Snooping (CRITICAL for sACN multicast)

```text
configure terminal
ip igmp snooping
! Enable IGMP snooping globally

vlan 10
 ip igmp snooping
! Enable IGMP snooping in show VLAN

ip igmp snooping drop-unknown vlan-exclusive
! Drop unknown multicast where required by policy

ip igmp snooping fastlearn 1/1/1,1/1/2,1/1/3
! Fast-learn joins on endpoint-facing ports

ip igmp snooping querier
! Enable querier so multicast group state is maintained
```

```text
show ip igmp snooping
! Verify global/VLAN snooping and querier status
```

> Exit10 critical note: without an IGMP snooping querier on the show VLAN, sACN multicast may not reach LED/DMX endpoints reliably.

## 5) LAG / LACP (Link Aggregation)

```text
configure terminal
interface lag 1
 description Core uplink LAG
 no shutdown
 lacp mode active
 vlan trunk native 10
 vlan trunk allowed 10,20,30
! Create LAG and define LACP behavior

interface 1/1/49
 lag 1
! Add physical port to LAG 1

interface 1/1/50
 lag 1
! Add second physical port to LAG 1
```

```text
configure terminal
interface lag 2
 lacp mode passive
! Passive side example (waits for active partner)
```

```text
show lacp
! Verify LAG members and negotiation state
```

## 6) Spanning Tree

```text
configure terminal
spanning-tree mode mstp
! Or use: spanning-tree mode rpvst

spanning-tree priority 4096
! Lower value = higher root preference

interface 1/1/1
 spanning-tree port-type admin-edge
! End-device port: skip long transition delays
```

```text
show spanning-tree
! Verify mode, root, and per-port STP state
```

## 7) IP routing / SVIs (Layer 3)

```text
configure terminal
ip routing
! Enable Layer 3 routing globally

interface vlan 10
 ip address 10.154.10.1/24
 no shutdown
! SVI gateway for show-control VLAN

interface vlan 20
 ip address 10.154.20.1/24
 no shutdown
! Example second SVI for inter-VLAN routing
```

```text
show ip route
! Verify connected and learned routes
```

## 8) Access Control / Security (basic)

```text
configure terminal
aaa authentication login default local
! Use local user database for login authentication

username admin privilege 15 password plaintext <pw>
! Create/update local admin account (replace <pw>)
```

> Security note: avoid leaving plaintext credentials in shared logs/backups. Use your standard secure credential handling process after initial bootstrap.

## 9) Show / diagnostic commands

```text
show interface status
! Quick health of all interfaces

show mac-address-table
! Verify endpoint MAC learning per VLAN/port

show lldp neighbors
! Validate physical neighbor discovery

show ip igmp snooping
! Check multicast listener handling and querier

show vlan
! VLAN membership validation

show lacp
! LAG/LACP state

show spanning-tree
! STP topology and blocked/forwarding ports
```

## 10) Save & reload

```text
copy running-config startup-config
! Persist config across reboot

reload
! Reboot switch (plan maintenance window)
```

## Common Mistakes

- Forgetting IGMP querier on show VLAN -> sACN multicast can drop or never forward to nodes.
- Forgetting to save config (`write memory` or `copy running-config startup-config`) -> changes lost after reboot.
- Trunk port missing required VLAN tag -> endpoints in that VLAN become unreachable.
- End-device ports not set to `spanning-tree port-type admin-edge` -> unnecessary STP delays during link-up.
- Misaligning endpoint addressing with the show-control IP plan can break endpoint reachability.
- Verify Watchout server addressing against the **Exit10 Network Context** section before deployment.
