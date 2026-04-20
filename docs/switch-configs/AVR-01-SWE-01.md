# AVR-01-SWE-01 — IDF-FF-03A

## Overview

| Field | Value |
|---|---|
| Hostname | `AVR-01-SWE-01` |
| IP | `10.154.10.21` |
| Model | CX 6300F 24P (JL666A) |
| Part # | JL666A |
| Location | IDF-FF-03A |
| Port count | 24 + 1 uplink |

## Port Assignment Table

| Port | VLAN | Device | Notes |
|---|---|---|---|
| 1 | 20 | AVR-01-AMP-01 |  |
| 2 | 20 | AVR-01-AMP-02 |  |
| 3 | 20 | AVR-01-AMP-03 |  |
| 4 | 20 | AVR-01-AMP-04 |  |
| 5 | 20 | AVR-01-AMP-05 |  |
| 6 | 20 | AVR-01-AMP-06 |  |
| 7 | 20 | AVR-01-AMP-07 |  |
| 8 | 20 | AVR-01-AMP-08 |  |
| 9 | 20 | AVR-01-AMP-09 |  |
| 10 | 20 | AVR-01-AMP-10 |  |
| 11 | 20 | TSC-201 |  |
| 12 | 20 | TSC-202 |  |
| 13 | 10 | ACB-103-1 |  |
| 14 | 10 | ACB-103-2 |  |
| 15 | 10 | ACB-104-1 |  |
| 16 | 10 | ACB-104-2 |  |
| 17 | 10 | ACB-201-1 |  |
| 18 | 10 | ACB-201-2 |  |
| 19 | 10 | Reserved - no device |  |
| 20 | 10 | Reserved - no device |  |
| 21 | 30 | ACB-103 |  |
| 22 | 30 | ACB-104 |  |
| 23 | 30 | ACB-201 |  |
| 24 | 30 | Reserved - no device |  |
| 25 | TRUNK | AVR-08-SFP-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |
| 26 | — | SPARE |  |
| 27 | — | SPARE |  |
| 28 | — | SPARE |  |

## Step 1 — Initial Setup

```text
! ============================================================
! STEP 1 — INITIAL SETUP (run once via serial console / default web UI)
! Factory default credentials: admin / (no password)
! ============================================================

configure terminal

  ! --- Hostname ---
  hostname AVR-01-SWE-01

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
    ip address 10.154.10.21/24
    no shutdown
  exit

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

end

write memory
```

> Note: Run this first via serial console or factory web UI before connecting to the network.

## Step 2 — Main Configuration

### To connect to switch
| Windows PowerShell | `ssh admin@10.154.10.21` |
|---|---|

```text
! ============================================================
! AVR-01-SWE-01 — IDF-FF-03A
! IP: 10.154.10.21 | Model: CX 6300F 24P (JL666A)
! VLANs: 10=Control 20=QLAN 30=Dante 40=Lighting 50=Landlord
! ============================================================

configure terminal

  hostname AVR-01-SWE-01

  ! --- VLANs ---
  vlan 10
    name Control
  vlan 20
    name QLAN
  vlan 30
    name Dante
  vlan 40
    name Lighting
  vlan 50
    name Landlord

  ! --- Management IP (Control VLAN SVI) ---
  interface vlan 10
    ip address 10.154.10.21/24
    no shutdown
  exit

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

  ! --- QoS for Dante (Audinate recommended DSCP priorities) ---
  qos dscp-map 56 local-priority 7 name CS7
  qos dscp-map 46 local-priority 5 name EF
  qos dscp-map 8  local-priority 1 name CS1
  qos dscp-map 0  local-priority 1 name CS0


  ! --- IGMP Snooping ---
  vlan 20
    ip igmp snooping enable
  vlan 30
    ip igmp snooping enable
  vlan 40
    ip igmp snooping enable
  vlan 50
    no ip igmp snooping
  exit

  ! --- Spanning Tree ---
  spanning-tree mode mstp
  spanning-tree priority 8

  ! --- Interfaces ---
  interface 1/1/1
    description "AVR-01-AMP-01"
    vlan access 20
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/2
    description "AVR-01-AMP-02"
    vlan access 20
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/3
    description "AVR-01-AMP-03"
    vlan access 20
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/4
    description "AVR-01-AMP-04"
    vlan access 20
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/5
    description "AVR-01-AMP-05"
    vlan access 20
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/6
    description "AVR-01-AMP-06"
    vlan access 20
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/7
    description "AVR-01-AMP-07"
    vlan access 20
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/8
    description "AVR-01-AMP-08"
    vlan access 20
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/9
    description "AVR-01-AMP-09"
    vlan access 20
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/10
    description "AVR-01-AMP-10"
    vlan access 20
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/11
    description "TSC-201"
    vlan access 20
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/12
    description "TSC-202"
    vlan access 20
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/13
    description "ACB-103-1"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/14
    description "ACB-103-2"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/15
    description "ACB-104-1"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/16
    description "ACB-104-2"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/17
    description "ACB-201-1"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/18
    description "ACB-201-2"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/19
    description "Reserved - no device"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/20
    description "Reserved - no device"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/21
    description "ACB-103"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/22
    description "ACB-104"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/23
    description "ACB-201"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/24
    description "Reserved - no device"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/25
    description "TRUNK to AVR-08-SFP-01"
    vlan trunk allowed all
    vlan trunk native 10
    no spanning-tree bpdu-guard
    no shutdown

  interface 1/1/26
    description SPARE
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/27
    description SPARE
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/28
    description SPARE
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

end

write memory
```

## Notes & Verification

- No uncertain ports were identified in the provided assignment table.
- `spanning-tree port-type admin-edge` makes endpoint ports forward immediately (faster link-up for end devices).
- `no shutdown` administratively enables each configured port.
- Verify Dante ports: `show running-config interface 1/1/<port>` should include `vlan access 30` and `qos trust dscp`.
- Verify multicast: VLAN 30 and VLAN 40 should show `ip igmp snooping enable`; querier should run from AVR-08-SFP-01 only.
