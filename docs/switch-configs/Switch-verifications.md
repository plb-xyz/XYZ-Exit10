# Switch Verification — AOS-CX CLI Checklist

Run these commands via SSH after applying the Step 1 and Step 2 configs.

**Connect:** `ssh admin@10.154.10.XX`

---

## 1. System

```text
show version
```
**Expected:** Correct hostname (e.g. `AVR-01-SWE-01`), firmware `FL.10.10.x` or later.

---

## 2. Users & Services

```text
show user-list
show https-server
show ssh server
show snmp server
```
**Expected:** `admin` in `administrators` group. All three services show `vrf default` active.

---

## 3. VLANs

```text
show vlan
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
show interface vlan 10
show ip route
ping 10.154.10.1
```
**Expected:** VLAN 10 shows correct IP (e.g. `10.154.10.21/24`), state `up`.
Default route `0.0.0.0/0 via 10.154.10.1` present. Ping succeeds.

---

## 5. IGMP Snooping

```text
show ip igmp snooping
```
**Expected:**
```
VLAN  IGMP Snooping  Querier
30    disabled       none     ← Dante — must be OFF
40    enabled        active   ← Lighting — must be ON + querier active
```
> ℹ️ IGMP is ON by default for all VLANs. Only VLAN 30 needs an explicit `no ip igmp snooping`.
> The querier runs from AVR-08-SFP-01 (core) only — edge switches will show `none` for querier on VLAN 40, which is correct.

---

## 6. Spanning Tree

```text
show spanning-tree
```
**Expected:**
- **AVR-08-SFP-01 (core):** `This bridge is the root`
- **All other switches:** Root bridge points to `10.154.10.20`

---

## 7. Interfaces

```text
show interface brief
```
**Expected:** Connected ports show `up`. Unused ports show `down` (normal).

---

## 8. QoS — DSCP Map

```text
show qos dscp-map
```
**Expected — look for these three entries:**
```
DSCP  Name  local-priority
8     CS1   1              ← Reserved low priority
46    EF    5              ← Dante audio
56    CS7   7              ← PTP clock sync
```

---

## 9. Dante Ports

Check each Dante port (VLAN 30) individually.
Replace `1/1/XX` with the actual Dante port number for this switch.

```text
show running-config interface 1/1/XX
```

**Expected output for every Dante port:**
```text
interface 1/1/XX
    description "Dante - <DEVICE>"
    no shutdown
    no routing
    vlan access 30
    qos trust dscp              ← must be present on every Dante port
    no eee                      ← must be present — prevents audio glitches
    spanning-tree port-type admin-edge
    exit
```

**What to verify per port:**

| Check | Look for | If missing |
|---|---|---|
| Correct VLAN | `vlan access 30` | Port is on wrong VLAN |
| QoS scoped to port | `qos trust dscp` | DSCP not trusted — Dante priority won't work |
| EEE disabled | `no eee` | Run `no eee` on the port + `write memory` |
| Fast convergence | `spanning-tree port-type admin-edge` | Port takes 30s to come up after reboot |

**Fix if `qos trust dscp` or `no eee` is missing:**
```text
configure terminal
interface 1/1/XX
qos trust dscp
no eee
exit
exit
write memory
```

---

## 10. Config Saved

```text
show startup-config
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
| 13 | QoS map | `show qos dscp-map` | CS7=7, EF=5, CS1=1 |
| 14 | Dante ports | `show running-config interface 1/1/XX` | `qos trust dscp` + `no eee` on each |
| 15 | Saved | `show startup-config` | Matches running config |
