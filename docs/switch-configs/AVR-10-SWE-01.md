# AVR-10-SWE-01 — EER

## Overview

| Field | Value |
|---|---|
| Hostname | `AVR-10-SWE-01` |
| IP | `10.154.10.30` |
| Model | CX 6300F 48P (JL665A) |
| Part # | JL665A |
| Location | EER |
| Port count | 48 + 1 uplink |

## Port Assignment Table

| Port | VLAN | Device | Notes |
|---|---|---|---|
| 1 | 10 | AVR-10-VSR-01 |  |
| 2 | 10 | AVR-10-VSR-02 |  |
| 3 | 10 | AVR-10-VSR-03 |  |
| 4 | 10 | AVR-10-VSR-04 |  |
| 5 | 10 | AVR-10-VSR-05 |  |
| 6 | 10 | AVR-10-VSR-06 |  |
| 7 | 10 | AVR-10-VSR-07 |  |
| 8 | 10 | AVR-10-VSR-08 |  |
| 9 | 10 | AVR-10-VSR-SP-01 |  |
| 10 | 10 | AVR-09-H15-01A |  |
| 11 | 10 | AVR-09-H15-01B |  |
| 12 | 10 | MPU-S9900-01 |  |
| 13 | 10 | MPU-S9900-02 |  |
| 14 | 10 | AVR-09-UPS-001 |  |
| 15 | 10 | AVR-10-UPS-01 |  |
| 16 | 10 | AVR-11-UPS-01 |  |
| 17 | — | SPARE |  |
| 18 | — | SPARE |  |
| 19 | — | SPARE |  |
| 20 | — | SPARE |  |
| 21 | — | SPARE |  |
| 22 | — | SPARE |  |
| 23 | — | SPARE |  |
| 24 | — | SPARE |  |
| 25 | — | SPARE |  |
| 26 | — | SPARE |  |
| 27 | 30 | AVR-10-VSR-01 |  |
| 28 | 30 | AVR-10-VSR-02 |  |
| 29 | 30 | Reserved - no device |  |
| 30 | 30 | Reserved - no device |  |
| 31 | — | SPARE |  |
| 32 | — | SPARE |  |
| 33 | — | SPARE |  |
| 34 | — | SPARE |  |
| 35 | — | SPARE |  |
| 36 | — | SPARE |  |
| 37 | — | SPARE |  |
| 38 | — | SPARE |  |
| 39 | — | SPARE |  |
| 40 | — | SPARE |  |
| 41 | — | SPARE |  |
| 42 | — | SPARE |  |
| 43 | — | SPARE |  |
| 44 | — | SPARE |  |
| 45 | 10 | Reserved - no device |  |
| 46 | 10 | Reserved - no device |  |
| 47 | 50 | Reserved - no device |  |
| 48 | 50 | Reserved - no device |  |
| 49 | TRUNK | AVR-08-SFP-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |
| 50 | — | SPARE |  |
| 51 | — | SPARE |  |
| 52 | — | SPARE |  |

## Step 1 — Initial Setup

```text
! ============================================================
! STEP 1 — INITIAL SETUP (run once via serial console / default web UI)
! Factory default credentials: admin / (no password)
! ============================================================

configure terminal

  ! --- Hostname ---
  hostname AVR-10-SWE-01

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
    ip address 10.154.10.30/24
    no shutdown

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

end

write memory
```

> Note: Run this first via serial console or factory web UI before connecting to the network.

## Step 2 — Main Configuration

### To connect to switch
| Windows PowerShell | `ssh admin@10.154.10.30` |
|---|---|

```text
! ============================================================
! AVR-10-SWE-01 — EER
! IP: 10.154.10.30 | Model: CX 6300F 48P (JL665A)
! VLANs: 10=Control 20=QLAN 30=Dante 40=Lighting 50=Landlord
! ============================================================

configure terminal

  hostname AVR-10-SWE-01

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
    ip address 10.154.10.30/24
    no shutdown

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

  ! --- QoS for Dante (Audinate recommended DSCP priorities) ---
  qos dscp-map 56 local-priority 7    ! CS7  — PTP clock sync (High)
  qos dscp-map 46 local-priority 5    ! EF   — Dante audio (Medium)
  qos dscp-map 8  local-priority 1    ! CS1  — Reserved (Low)


  ! --- IGMP Snooping ---
  vlan 20
    ip igmp snooping enable
  vlan 30
    ip igmp snooping enable
  vlan 40
    ip igmp snooping enable
  vlan 50
    no ip igmp snooping
  ! --- Spanning Tree ---
  spanning-tree mode mstp
  spanning-tree priority 8

  ! --- Interfaces ---
  interface 1/1/1
    description "AVR-10-VSR-01"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/2
    description "AVR-10-VSR-02"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/3
    description "AVR-10-VSR-03"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/4
    description "AVR-10-VSR-04"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/5
    description "AVR-10-VSR-05"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/6
    description "AVR-10-VSR-06"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/7
    description "AVR-10-VSR-07"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/8
    description "AVR-10-VSR-08"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/9
    description "AVR-10-VSR-SP-01"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/10
    description "AVR-09-H15-01A"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/11
    description "AVR-09-H15-01B"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/12
    description "MPU-S9900-01"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/13
    description "MPU-S9900-02"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/14
    description "AVR-09-UPS-001"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/15
    description "AVR-10-UPS-01"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/16
    description "AVR-11-UPS-01"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/17
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/18
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/19
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/20
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/21
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/22
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/23
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/24
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/25
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/26
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/27
    description "AVR-10-VSR-01"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/28
    description "AVR-10-VSR-02"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/29
    description "Reserved - no device"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/30
    description "Reserved - no device"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/31
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/32
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/33
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/34
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/35
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/36
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/37
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/38
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/39
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/40
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/41
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/42
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/43
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/44
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/45
    description "Reserved - no device"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/46
    description "Reserved - no device"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/47
    description "Reserved - no device"
    vlan access 50
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/48
    description "Reserved - no device"
    vlan access 50
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/49
    description "TRUNK to AVR-08-SFP-01"
    vlan trunk allowed all
    vlan trunk native 10
    no spanning-tree bpdu-guard
    no shutdown

  interface 1/1/50
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/51
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/52
    description "SPARE"
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
