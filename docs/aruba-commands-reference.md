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
| AVR-01-SWE-01 | Network Switch | CX 6300F 24P | JL666A | IDF-FF-03A | Control | 10.154.10.21 |
| AVR-02-SWE-01 | Network Switch | CX 6300F 24P | JL666A | IDF-GF-06 | Control | 10.154.10.22 |
| AVR-03-SWE-01 | Network Switch | CX 6300F 24P | JL666A | IDF-FF-08 | Control | 10.154.10.23 |
| AVR-04-SWE-01 | Network Switch | CX 6300F 48P | JL665A | IDF-GF-P1 | Control | 10.154.10.24 |
| AVR-05-SWE-01 | Network Switch | CX 6300F 48P | JL665A | IDF-GF-P2 | Control | 10.154.10.25 |
| AVR-07-SWE-01 | Network Switch | CX 6300F 48P | JL665A | EER (AVR-07) | Control | 10.154.10.26 |
| AVR-08-SFP-01 | Core Switch | CX 6300M 24P | JL658A | EER (AVR-08) | Control | 10.154.10.27 |
| AVR-10-SWE-01 | Network Switch | CX 6300F 48P | JL665A | EER (AVR-10) | Control | 10.154.10.28 |
| AVR-12-SWE-01 | Network Switch | CX 6300F 24P | JL666A | IDF-GF-013 (AVR-12) | Control | 10.154.10.29 |

- All switches are **Aruba AOS-CX**, firmware **10.13/10.14**
- Management access via SSH or web UI on the Control VLAN (`10.154.10.x`)
- `AVR-08-SFP-01` is the **core/uplink switch** (CX 6300M)
- To SSH into a switch: `ssh admin@10.154.10.2x` (use the exact IP from the table above: `10.154.10.21`-`10.154.10.29`)

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
