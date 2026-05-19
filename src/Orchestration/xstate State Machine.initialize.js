// Verify XState runtime availability
if (!xstate || typeof xstate.createMachine !== 'function' || typeof xstate.createActor !== 'function') {
    node.status({ fill: 'red', shape: 'ring', text: 'xstate missing in runtime' });
    node.error('XState runtime not available. Add xstate to settings.js functionGlobalContext and restart Node-RED.');
    return;
}

const { createMachine, createActor } = xstate;

const machineDefinition = {
    "id": "Exit10",
    "initial": "INIT",
    "states": {
        "INIT": {
            "on": {
                "SYS_READY": [{ "target": "IDLE" }]
            }
        },
        "IDLE": {
            "on": {
                "NORMAL_ENTER": [{ "target": "NORMAL" }],
                "SHOW_GO": [{ "target": "SHOW", "guard": "canStartShow" }]
            }
        },
        "NORMAL": {
            "type": "parallel",
            "on": {
                "GOTO_IDLE": [{ "target": "IDLE" }],
                "SHOW_GO": [{ "target": "SHOW", "guard": "canStartShow" }]
            },
            "states": {
                "A1 AUDIO": {
                    "initial": "BGM",
                    "states": {
                        "BGM": {
                            "on": {
                                "A1_AUDIO_SPECIAL": [{ "target": "SPECIAL" }],
                                "A1_AUDIO_NONE": [{ "target": "NONE" }]
                            }
                        },
                        "SPECIAL": {
                            "on": {
                                "A1_AUDIO_NONE": [{ "target": "NONE" }],
                                "A1_AUDIO_BGM": [{ "target": "BGM" }]
                            }
                        },
                        "NONE": {
                            "on": {
                                "A1_AUDIO_BGM": [{ "target": "BGM" }],
                                "A1_AUDIO_SPECIAL": [{ "target": "SPECIAL" }]
                            }
                        }
                    }
                },
                "A1 AMBIENCE": {
                    "initial": "AMBIENCE",
                    "on": {
                        "A1_EVENT_SIMPLE_START": [{ "target": "#Exit10.NORMAL.A1 Events.SIMPLE" }],
                        "A1_EVENT_COMPLEX_START": [{ "target": "#Exit10.NORMAL.A1 Events.COMPLEX" }]
                    },
                    "states": {
                        "AMBIENCE": {
                            "on": {
                                "A1_ONTOP_START": [{ "target": "ON TOP" }],
                                "A1_FULLSCREEN_START": [{ "target": "FULL SCREEN" }]
                            }
                        },
                        "ON TOP": {
                            "on": {
                                "A1_ONTOP_END": [{ "target": "AMBIENCE" }]
                            }
                        },
                        "FULL SCREEN": {
                            "on": {
                                "A1_FULLSCREEN_END": [{ "target": "AMBIENCE" }]
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
                                "A1_EVENT_SIMPLE_END": [{ "target": "NONE" }]
                            }
                        },
                        "COMPLEX": {
                            "on": {
                                "A1_EVENT_COMPLEX_END": [{ "target": "NONE" }]
                            }
                        }
                    }
                },
                "A2 AMBIENCE": {
                    "initial": "AMBIENCE",
                    "on": {
                        "A2_EVENT_SIMPLE_START": [{ "target": "#Exit10.NORMAL.A2 Events.SIMPLE" }],
                        "A2_EVENT_COMPLEX_START": [{ "target": "#Exit10.NORMAL.A2 Events.COMPLEX" }]
                    },
                    "states": {
                        "AMBIENCE": {
                            "on": {
                                "A2_ONTOP_START": [{ "target": "ON TOP" }],
                                "A2_FULLSCREEN_START": [{ "target": "FULL SCREEN" }]
                            }
                        },
                        "ON TOP": {
                            "on": {
                                "A2_ONTOP_END": [{ "target": "AMBIENCE" }]
                            }
                        },
                        "FULL SCREEN": {
                            "on": {
                                "A2_FULLSCREEN_END": [{ "target": "AMBIENCE" }]
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
                                "A2_EVENT_SIMPLE_END": [{ "target": "NONE" }]
                            }
                        },
                        "COMPLEX": {
                            "on": {
                                "A2_EVENT_COMPLEX_END": [{ "target": "NONE" }]
                            }
                        }
                    }
                },
                "A3 AMBIENCE": {
                    "initial": "AMBIENCE",
                    "on": {
                        "A3_EVENT_SIMPLE_START": [{ "target": "#Exit10.NORMAL.A3 Events.SIMPLE" }],
                        "A3_EVENT_COMPLEX_START": [{ "target": "#Exit10.NORMAL.A3 Events.COMPLEX" }]
                    },
                    "states": {
                        "AMBIENCE": {
                            "on": {
                                "A3_ONTOP_START": [{ "target": "ON TOP" }],
                                "A3_FULLSCREEN_START": [{ "target": "FULL SCREEN" }]
                            }
                        },
                        "ON TOP": {
                            "on": {
                                "A3_ONTOP_END": [{ "target": "AMBIENCE" }]
                            }
                        },
                        "FULL SCREEN": {
                            "on": {
                                "A3_FULLSCREEN_END": [{ "target": "AMBIENCE" }]
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
                                "A3_EVENT_SIMPLE_END": [{ "target": "NONE" }]
                            }
                        },
                        "COMPLEX": {
                            "on": {
                                "A3_EVENT_COMPLEX_END": [{ "target": "NONE" }]
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
                                        "LS_AUDIO_SPECIAL": [{ "target": "SPECIAL" }],
                                        "LS_AUDIO_NONE": [{ "target": "NONE" }]
                                    }
                                },
                                "SPECIAL": {
                                    "on": {
                                        "LS_AUDIO_NONE": [{ "target": "NONE" }],
                                        "LS_AUDIO_BGM": [{ "target": "BGM" }]
                                    }
                                },
                                "NONE": {
                                    "on": {
                                        "LS_AUDIO_BGM": [{ "target": "BGM" }],
                                        "LS_AUDIO_SPECIAL": [{ "target": "SPECIAL" }]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "SHOW": {
            "entry": { "type": "emitShowStarted" },
            "exit": { "type": "emitShowEnded" },
            "on": {
                "GOTO_IDLE": [{ "target": "IDLE" }],
                "SHOW_END": [{ "target": "NORMAL" }]
            }
        }
    }
};

const guards = {
    canStartShow: () => {
        return flow.get('prayerGuardAllowed') !== false;
    }
};

const actions = {
    emitShowStarted: () => {
        const key = flow.get('xstate_active_show_key') || null;
        node.send([null, {
            topic: 'cmd',
            payload: {
                v: 1,
                source: 'statemachine',
                action: 'show.go',
                params: { key },
                meta: { reason: 'entry', state: 'SHOW' }
            }
        }]);
    },
    emitShowEnded: () => {
        const key = flow.get('xstate_active_show_key') || null;
        node.send([null, {
            topic: 'cmd',
            payload: {
                v: 1,
                source: 'statemachine',
                action: 'show.end',
                params: { key },
                meta: { reason: 'exit', state: 'SHOW' }
            }
        }]);
    }
};

const machine = createMachine(machineDefinition, { guards, actions });

const previous = flow.get('xstate_actor');
if (previous && typeof previous.stop === 'function') {
    try { previous.stop(); } catch (e) { }
}

const actor = createActor(machine);

actor.subscribe(snapshot => {
    const stateValue = snapshot.value;

    flow.set('xstate_snapshot', snapshot);
    flow.set('xstate_state', stateValue);

    let fill = 'grey';
    let text = '';

    if (stateValue === 'INIT') {
        fill = 'grey';
        text = 'INIT';
    } else if (stateValue === 'IDLE') {
        fill = 'blue';
        text = 'IDLE';
    } else if (stateValue === 'SHOW') {
        fill = 'yellow';
        text = 'SHOW';
    } else if (typeof stateValue === 'object') {
        const a1audio = stateValue['A1 AUDIO'] || '?';
        const a1ambience = stateValue['A1 AMBIENCE'] || '?';
        const a1events = stateValue['A1 Events'] || 'NONE';
        fill = 'green';
        text = 'NORMAL | A1aud:' + a1audio + ' A1amb:' + a1ambience + (a1events !== 'NONE' ? ' EVT:' + a1events : '');
    }

    node.status({ fill, shape: 'dot', text });

    node.send([{
        topic: 'evt/statemachine/state',
        payload: {
            v: 1,
            source: 'statemachine',
            state: stateValue,
            snapshot: snapshot.value
        }
    }, null]);
});

actor.start();

flow.set('xstate_actor', actor);

node.status({ fill: 'grey', shape: 'dot', text: 'INIT' });
node.warn('Exit10 state machine started (strict event schema)');