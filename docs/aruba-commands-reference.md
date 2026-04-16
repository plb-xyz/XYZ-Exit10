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
- Exit10 Watchout servers are `10.154.10.141-142` (Production) and `10.154.10.151-159` (Display).
