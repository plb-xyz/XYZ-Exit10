# Switch Verification — AOS-CX CLI Checklist

Run these commands via SSH or the web UI CLI after applying the Step 1 and Step 2 configs.

**Connect:** `ssh admin@10.154.10.XX`

---

## 1. System

```text
show version                   ! hostname, firmware version, uptime
```
**Expected:** Correct hostname (e.g. `AVR-01-SWE-01`), firmware `FL.10.10.x` or later.

---

## 2. Users & Services

```text
show user-list                 ! admin user exists in administrators group
show https-server              ! web UI enabled on vrf default
show ssh server                ! SSH enabled on vrf default
show snmp server               ! SNMP enabled on vrf default
```
**Expected:** All four show `vrf default` active.

---

## 3. VLANs

```text
show vlan                      ! confirm VLANs 10/20/30/40 exist with correct names
```
**Expected:**
```
VLAN  Name      Status
10    Control   up
20    QLAN      up
30    Dante     up
40    Lighting  up
```

---

## 4. Management IP & Routing

```text
show interface vlan 10         ! IP assigned, state up
show ip route                  ! default route 0.0.0.0/0 via 10.154.10.1
ping 10.154.10.1               ! gateway reachable
```
**Expected:** VLAN 10 shows correct IP (e.g. `10.154.10.21/24`), state `up`. Ping succeeds.

---

## 5. IGMP Snooping

```text
show ip igmp snooping          ! per-VLAN IGMP status
```
**Expected:**
```
VLAN  IGMP Snooping  Querier
30    disabled       none     ← Dante — must be OFF
40    enabled        active   ← Lighting — must be ON + querier
```

---

## 6. Spanning Tree

```text
show spanning-tree             ! MSTP mode, root bridge election result
```
**Expected:**
- **AVR-08-SFP-01 (core):** `This bridge is the root`
- **All other switches:** Root bridge = `10.154.10.20`

---

## 7. Interfaces

```text
show interface brief           ! all ports — state, speed, VLAN assignment
```
**Expected:** Connected ports show `up`. Unused ports show `down` (normal).

---

## 8. QoS

```text
show qos dscp-map              ! DSCP priority mapping
```
**Expected:**
```
DSCP 56 (CS7)  → local-priority 7   ! PTP clock — High
DSCP 46 (EF)   → local-priority 5   ! Dante audio — Medium
DSCP  8 (CS1)  → local-priority 1   ! Reserved — Low
```

---

## 9. Config Saved

```text
show startup-config            ! confirm write memory was run
```
**Expected:** Startup config matches running config. If not, run `write memory`.

---

## Quick Reference

| # | Check | Command | Expected |
|---|---|---|---|
| 1 | System | `show version` | Correct hostname, FL.10.10.x |
| 2 | Users | `show user-list` | admin in administrators group |
| 3 | Web UI | `show https-server` | vrf default enabled |
| 4 | SSH | `show ssh server` | vrf default enabled |
| 5 | SNMP | `show snmp server` | vrf default enabled |
| 6 | VLANs | `show vlan` | 10 Control, 20 QLAN, 30 Dante, 40 Lighting |
| 7 | Mgmt IP | `show interface vlan 10` | IP assigned, state up |
| 8 | Route | `show ip route` | 0.0.0.0/0 via 10.154.10.1 |
| 9 | Gateway | `ping 10.154.10.1` | Success |
| 10 | IGMP | `show ip igmp snooping` | VLAN 30 off, VLAN 40 on + querier |
| 11 | STP | `show spanning-tree` | AVR-08-SFP-01 = root |
| 12 | Ports | `show interface brief` | Connected ports up |
| 13 | QoS | `show qos dscp-map` | CS7=7, EF=5, CS1=1 |
| 14 | Saved | `show startup-config` | Matches running config |
