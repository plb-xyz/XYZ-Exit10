# AVR-08-SFP-01 — EER — Core Fiber

## Overview

| Field | Value |
|---|---|
| Hostname | `AVR-08-SFP-01` |
| IP | `10.154.10.20` |
| Model | CX 6300M 24P SFP (JL658A) |
| Part # | JL658A |
| Location | EER — Core Fiber |
| Port count | 24 SFP |

## Port Assignment Table

| Port | VLAN | Device | Notes |
|---|---|---|---|
| 1 | TRUNK | AVR-01-SWE-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |
| 2 | TRUNK | AVR-02-SWE-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |
| 3 | TRUNK | AVR-03-SWE-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |
| 4 | TRUNK | AVR-04-SWE-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |
| 5 | TRUNK | AVR-05-SWE-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |
| 6 | TRUNK | AVR-07-SWE-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |
| 7 | TRUNK | AVR-08-SWE-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |
| 8 | TRUNK | AVR-10-SWE-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |
| 9 | 40 | AVR-06-NOD-01 |  |
| 10 | 40 | PWR-02.0-10002 |  |
| 11 | 40 | PWR-02.0-10004 |  |
| 12 | 40 | PWR-02.0-10005 |  |
| 13 | 40 | PWR-02.0-10006 |  |
| 14 | 40 | PWR-02.0-10008 |  |
| 15 | 40 | PWR-02.0-10010 |  |
| 16 | 40 | PWR-02.0-10001 |  |
| 17 | 40 | PWR-02.0-20004 |  |
| 18 | 40 | PWR-01.0-20005 |  |
| 19 | 40 | PWR-02.0-20001 |  |
| 20 | 40 | PWR-02.0-30001 |  |
| 21 | 40 | WISK-NODE-101 |  |
| 22 | 10 | ACB-101 |  |
| 23 | 10 | ACB-201 |  |
| 24 | 10 | ACB-301 |  |

## Step 1 — Initial Setup

```text
! ============================================================
! STEP 1 — INITIAL SETUP (run once via serial console / default web UI)
! Factory default credentials: admin / (no password)
! ============================================================

configure terminal

  ! --- Hostname ---
  hostname AVR-08-SFP-01

  ! --- Admin user ---
  user admin group administrators password plaintext Exit10-2026!

  ! --- Enable HTTPS web UI ---
  https-server vrf default
  https-server rest access-mode read-write

  ! --- Enable SSH ---
  ssh server vrf default

  ! --- SNMP (required for ISAAC integration) ---
  snmp-server vrf default

  ! --- Management accessible on ALL ports (not just MGMT port) ---
  ! This allows SSH and web UI access from any connected port on any VLAN
  https-server vrf default
  ssh server vrf default

  ! --- Management IP on Control VLAN SVI (accessible from all ports) ---
  interface vlan 10
    ip address 10.154.10.20/24
    no shutdown

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

end

write memory
```

> Note: Run this first via serial console or factory web UI before connecting to the network.

## Step 2 — Main Configuration

### To connect to switch
| Windows PowerShell | `ssh admin@10.154.10.20` |
|---|---|

```text
! ============================================================
! AVR-08-SFP-01 — EER — Core Fiber
! IP: 10.154.10.20 | Model: CX 6300M 24P SFP (JL658A)
! VLANs: 10=Control 20=QLAN 30=Dante 40=Lighting
! ============================================================

configure terminal

  hostname AVR-08-SFP-01

  ! --- VLANs ---
  vlan 10
    name Control
  vlan 20
    name QLAN
  vlan 30
    name Dante
  vlan 40
    name Lighting

  ! --- Management IP (Control VLAN SVI) ---
  interface vlan 10
    ip address 10.154.10.20/24
    no shutdown

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

  ! --- IGMP Snooping ---
  vlan 30
    no ip igmp snooping
  vlan 40
    ip igmp snooping
    ip igmp snooping querier

  ! --- Spanning Tree ---
  spanning-tree mode mstp
  spanning-tree priority 1

  ! --- Interfaces ---
  interface 1/1/9
    description "AVR-06-NOD-01"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/10
    description "PWR-02.0-10002"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/11
    description "PWR-02.0-10004"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/12
    description "PWR-02.0-10005"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/13
    description "PWR-02.0-10006"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/14
    description "PWR-02.0-10008"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/15
    description "PWR-02.0-10010"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/16
    description "PWR-02.0-10001"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/17
    description "PWR-02.0-20004"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/18
    description "PWR-01.0-20005"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/19
    description "PWR-02.0-20001"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/20
    description "PWR-02.0-30001"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/21
    description "WISK-NODE-101"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/22
    description "ACB-101"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/23
    description "ACB-201"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/24
    description "ACB-301"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/1
    description "TRUNK to AVR-01-SWE-01"
    vlan trunk allowed all
    vlan trunk native 10
    no shutdown

  interface 1/1/2
    description "TRUNK to AVR-02-SWE-01"
    vlan trunk allowed all
    vlan trunk native 10
    no shutdown

  interface 1/1/3
    description "TRUNK to AVR-03-SWE-01"
    vlan trunk allowed all
    vlan trunk native 10
    no shutdown

  interface 1/1/4
    description "TRUNK to AVR-04-SWE-01"
    vlan trunk allowed all
    vlan trunk native 10
    no shutdown

  interface 1/1/5
    description "TRUNK to AVR-05-SWE-01"
    vlan trunk allowed all
    vlan trunk native 10
    no shutdown

  interface 1/1/6
    description "TRUNK to AVR-07-SWE-01"
    vlan trunk allowed all
    vlan trunk native 10
    no shutdown

  interface 1/1/7
    description "TRUNK to AVR-08-SWE-01"
    vlan trunk allowed all
    vlan trunk native 10
    no shutdown

  interface 1/1/8
    description "TRUNK to AVR-10-SWE-01"
    vlan trunk allowed all
    vlan trunk native 10
    no shutdown

end

write memory
```

## Notes & Verification

- No uncertain ports were identified in the provided assignment table.
- `spanning-tree port-type admin-edge` makes endpoint ports forward immediately (faster link-up for end devices).
- `no shutdown` administratively enables each configured port.
- Verify Dante ports: `show running-config interface 1/1/<port>` should include `vlan access 30` and `no eee`.
- Verify multicast: VLAN 30 should show `no ip igmp snooping`; VLAN 40 should show snooping + querier enabled.
