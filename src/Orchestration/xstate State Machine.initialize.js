// ─── Pull functions out of the xstate module ───────────────────────────────
const { createMachine, createActor } = xstate;

// ─── Machine definition (your Stately.ai export) ───────────────────────────
const machineDefinition = {
    "id": "Exit10",
    "initial": "INIT",
    "states": {
        "INIT": {
            "on": {
                "Goto Idle": [{ "target": "IDLE" }]
            }
        },
        "IDLE": {
            "on": {
                "Trans to Normal": [{ "target": "NORMAL" }],
                "Start Show": [{ "target": "SHOW", "guard": "Prayer" }]
            }
        },
        "NORMAL": {
            "type": "parallel",
            "on": {
                "Goto Idle": [{ "target": "IDLE" }],
                "Start Show": [{ "target": "SHOW", "guard": "Prayer" }]
            },
            "states": {
                "A1 AUDIO": {
                    "initial": "BGM",
                    "states": {
                        "BGM": {
                            "on": {
                                "A1.AUDIO.SPECIAL": [{ "target": "SPECIAL" }],
                                "A1.AUDIO.NONE": [{ "target": "NONE" }]
                            }
                        },
                        "SPECIAL": {
                            "on": {
                                "A1.AUDIO.NONE": [{ "target": "NONE" }],
                                "A1.AUDIO.BGM": [{ "target": "BGM" }]
                            }
                        },
                        "NONE": {
                            "on": {
                                "A1.AUDIO.BGM": [{ "target": "BGM" }],
                                "A1.AUDIO.SPECIAL": [{ "target": "SPECIAL" }]
                            }
                        }
                    }
                },
                "A1 AMBIENCE": {
                    "initial": "AMBIENCE",
                    "on": {
                        "Start A1 Event Simple": [{ "target": "#Exit10.NORMAL.A1 Events.SIMPLE" }],
                        "Start A1 Event Complex": [{ "target": "#Exit10.NORMAL.A1 Events.COMPLEX" }]
                    },
                    "states": {
                        "AMBIENCE": {
                            "on": {
                                "Start A1 OnTop": [{ "target": "ON TOP" }],
                                "Start A1 FullScreen": [{ "target": "FULL SCREEN" }]
                            }
                        },
                        "ON TOP": {
                            "on": {
                                "End A1 OnTop": [{ "target": "AMBIENCE" }]
                            }
                        },
                        "FULL SCREEN": {
                            "on": {
                                "End A1 FullScreen": [{ "target": "AMBIENCE" }]
                            }
                        }
                    }
                },
                "A1 Events": {
                    "initial": "NONE",
                    "states": {
                        "NONE": {},
                        "SIMPLE": {
                            "on": {
                                "End A1 Event Simple": [{ "target": "NONE" }]
                            }
                        },
                        "COMPLEX": {
                            "on": {
                                "End A1 Event Complex": [{ "target": "NONE" }]
                            }
                        }
                    }
                },
                "A2 AMBIENCE": {
                    "initial": "AMBIENCE",
                    "on": {
                        "Start A2 Event Simple": [{ "target": "#Exit10.NORMAL.A2 Events.SIMPLE" }],
                        "Start A2 Event Complex": [{ "target": "#Exit10.NORMAL.A2 Events.COMPLEX" }]
                    },
                    "states": {
                        "AMBIENCE": {
                            "on": {
                                "Start A2 OnTop": [{ "target": "ON TOP" }],
                                "Start A2 FullScreen": [{ "target": "FULL SCREEN" }]
                            }
                        },
                        "ON TOP": {
                            "on": {
                                "End A2 OnTop": [{ "target": "AMBIENCE" }]
                            }
                        },
                        "FULL SCREEN": {
                            "on": {
                                "End A2 FullScreen": [{ "target": "AMBIENCE" }]
                            }
                        }
                    }
                },
                "A2 Events": {
                    "initial": "NONE",
                    "states": {
                        "NONE": {},
                        "SIMPLE": {
                            "on": {
                                "End A2 Event Simple": [{ "target": "NONE" }]
                            }
                        },
                        "COMPLEX": {
                            "on": {
                                "End A2 Event Complex": [{ "target": "NONE" }]
                            }
                        }
                    }
                },
                "A3 AMBIENCE": {
                    "initial": "AMBIENCE",
                    "on": {
                        "Start A3 Event Simple": [{ "target": "#Exit10.NORMAL.A3 Events.SIMPLE" }],
                        "Start A3 Event Complex": [{ "target": "#Exit10.NORMAL.A3 Events.COMPLEX" }]
                    },
                    "states": {
                        "AMBIENCE": {
                            "on": {
                                "Start A3 On Top": [{ "target": "ON TOP" }],
                                "Start A3 Full Screen": [{ "target": "FULL SCREEN" }]
                            }
                        },
                        "ON TOP": {
                            "on": {
                                "End A3 On Top": [{ "target": "AMBIENCE" }]
                            }
                        },
                        "FULL SCREEN": {
                            "on": {
                                "End A3 Full Screen": [{ "target": "AMBIENCE" }]
                            }
                        }
                    }
                },
                "A3 Events": {
                    "initial": "NONE",
                    "states": {
                        "NONE": {},
                        "SIMPLE": {
                            "on": {
                                "End A3 Event Simple": [{ "target": "NONE" }]
                            }
                        },
                        "COMPLEX": {
                            "on": {
                                "End A3 Event Complex": [{ "target": "NONE" }]
                            }
                        }
                    }
                },
                "LANDSCAPE": {
                    "type": "parallel",
                    "states": {
                        "LIGHTING": {
                            "initial": "AMBIENCE",
                            "states": {
                                "AMBIENCE": {}
                            }
                        },
                        "AUDIO": {
                            "initial": "BGM",
                            "states": {
                                "BGM": {
                                    "on": {
                                        "LS.AUDIO.SPECIAL": [{ "target": "SPECIAL" }],
                                        "LS.AUDIO.NONE": [{ "target": "NONE" }]
                                    }
                                },
                                "SPECIAL": {
                                    "on": {
                                        "LS.AUDIO.NONE": [{ "target": "NONE" }],
                                        "LS.AUDIO.BGM": [{ "target": "BGM" }]
                                    }
                                },
                                "NONE": {
                                    "on": {
                                        "LS.AUDIO.BGM": [{ "target": "BGM" }],
                                        "LS.AUDIO.SPECIAL": [{ "target": "SPECIAL" }]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "SHOW": {
            "entry": { "type": "startShowLogic" },
            "exit": { "type": "pharosWater1Normal" },
            "on": {
                "Goto Idle": [{ "target": "IDLE" }],
                "Trans to Normal": [{ "target": "NORMAL" }]
            }
        }
    }
};

// ─── Guards ────────────────────────────────────────────────────────────────
// "Prayer" guard: returns true if show is allowed to start.
// For now always true — replace with real logic later
// e.g. check time window, operator confirmation flag, etc.
const guards = {
    Prayer: () => {
        return flow.get('prayerGuardAllowed') !== false; // default: allowed
    }
};

// ─── Actions ───────────────────────────────────────────────────────────────
// Entry/exit actions emit command envelopes downstream (output 2)
const actions = {
    startShowLogic: () => {
        node.send([null, {
            topic: "cmd",
            payload: {
                v: 1,
                source: "statemachine",
                event: "entry",
                state: "SHOW",
                description: "Show started — trigger show logic"
            }
        }]);
    },
    pharosWater1Normal: () => {
        node.send([null, {
            topic: "cmd",
            payload: {
                v: 1,
                source: "statemachine",
                event: "exit",
                state: "SHOW",
                description: "Show ended — set Pharos Water1 to Normal"
            }
        }]);
    }
};

// ─── Create machine ────────────────────────────────────────────────────────
const machine = createMachine(machineDefinition, { guards, actions });

// ─── Create and start actor ────────────────────────────────────────────────
const actor = createActor(machine);

// ─── Subscribe: fires on every state transition ────────────────────────────
actor.subscribe(snapshot => {
    const stateValue = snapshot.value;

    // Store snapshot in flow context (queryable by other nodes)
    flow.set('xstate_snapshot', snapshot);
    flow.set('xstate_state', stateValue);

    // ── Node status display (visible under the node on the canvas) ──────────
    let fill = "grey";
    let text = "";

    if (stateValue === "INIT") {
        fill = "grey";
        text = "INIT";
    } else if (stateValue === "IDLE") {
        fill = "blue";
        text = "IDLE";
    } else if (stateValue === "SHOW") {
        fill = "yellow";
        text = "● SHOW";
    } else if (typeof stateValue === "object") {
        // NORMAL is parallel — value is an object of sub-states
        // Build a compact summary e.g. "NORMAL | A1:BGM | A2:AMBIENCE"
        const a1audio = stateValue["A1 AUDIO"] || "?";
        const a1ambience = stateValue["A1 AMBIENCE"] || "?";
        const a1events = stateValue["A1 Events"] || "NONE";
        fill = "green";
        text = `NORMAL | A1aud:${a1audio} A1amb:${a1ambience}${a1events !== "NONE" ? " EVT:" + a1events : ""}`;
    }

    node.status({ fill, shape: "dot", text });

    // ── Emit state change event downstream (output 1) ──────────────────────
    node.send([{
        topic: "evt/statemachine/state",
        payload: {
            v: 1,
            source: "statemachine",
            state: stateValue,
            snapshot: snapshot.value
        }
    }, null]);
});

// ─── Start the actor ───────────────────────────────────────────────────────
actor.start();

// ─── Store actor in flow context so On Message tab can reach it ───────────
flow.set('xstate_actor', actor);

node.status({ fill: "grey", shape: "dot", text: "INIT" });
node.warn("Exit10 state machine started");