import { setup } from 'xstate';

export const exit10Machine = setup({
  guards: {
    canStartShow: () => true
  },
  actions: {
    emitShowStarted: () => {},
    emitShowEnded: () => {}
  }
}).createMachine({
  id: 'Exit10',
  initial: 'INIT',
  states: {
    INIT: {
      on: {
        SYS_READY: [{ target: 'IDLE' }]
      }
    },
    IDLE: {
      on: {
        NORMAL_ENTER: [{ target: 'NORMAL' }],
        SHOW_GO: [{ target: 'SHOW', guard: 'canStartShow' }]
      }
    },
    NORMAL: {
      type: 'parallel',
      on: {
        GOTO_IDLE: [{ target: 'IDLE' }],
        SHOW_GO: [{ target: 'SHOW', guard: 'canStartShow' }]
      },
      states: {
        'A1 AUDIO': {
          initial: 'BGM',
          states: {
            BGM: {
              on: {
                A1_AUDIO_SPECIAL: [{ target: 'SPECIAL' }],
                A1_AUDIO_NONE: [{ target: 'NONE' }]
              }
            },
            SPECIAL: {
              on: {
                A1_AUDIO_NONE: [{ target: 'NONE' }],
                A1_AUDIO_BGM: [{ target: 'BGM' }]
              }
            },
            NONE: {
              on: {
                A1_AUDIO_BGM: [{ target: 'BGM' }],
                A1_AUDIO_SPECIAL: [{ target: 'SPECIAL' }]
              }
            }
          }
        },
        'A1 AMBIENCE': {
          initial: 'AMBIENCE',
          on: {
            A1_EVENT_SIMPLE_START: [{ target: '#Exit10.NORMAL.A1 Events.SIMPLE' }],
            A1_EVENT_COMPLEX_START: [{ target: '#Exit10.NORMAL.A1 Events.COMPLEX' }]
          },
          states: {
            AMBIENCE: {
              on: {
                A1_ONTOP_START: [{ target: 'ON TOP' }],
                A1_FULLSCREEN_START: [{ target: 'FULL SCREEN' }]
              }
            },
            'ON TOP': {
              on: {
                A1_ONTOP_END: [{ target: 'AMBIENCE' }]
              }
            },
            'FULL SCREEN': {
              on: {
                A1_FULLSCREEN_END: [{ target: 'AMBIENCE' }]
              }
            }
          }
        },
        'A1 Events': {
          initial: 'NONE',
          states: {
            NONE: {},
            SIMPLE: {
              on: {
                A1_EVENT_SIMPLE_END: [{ target: 'NONE' }]
              }
            },
            COMPLEX: {
              on: {
                A1_EVENT_COMPLEX_END: [{ target: 'NONE' }]
              }
            }
          }
        },
        'A2 AMBIENCE': {
          initial: 'AMBIENCE',
          on: {
            A2_EVENT_SIMPLE_START: [{ target: '#Exit10.NORMAL.A2 Events.SIMPLE' }],
            A2_EVENT_COMPLEX_START: [{ target: '#Exit10.NORMAL.A2 Events.COMPLEX' }]
          },
          states: {
            AMBIENCE: {
              on: {
                A2_ONTOP_START: [{ target: 'ON TOP' }],
                A2_FULLSCREEN_START: [{ target: 'FULL SCREEN' }]
              }
            },
            'ON TOP': {
              on: {
                A2_ONTOP_END: [{ target: 'AMBIENCE' }]
              }
            },
            'FULL SCREEN': {
              on: {
                A2_FULLSCREEN_END: [{ target: 'AMBIENCE' }]
              }
            }
          }
        },
        'A2 Events': {
          initial: 'NONE',
          states: {
            NONE: {},
            SIMPLE: {
              on: {
                A2_EVENT_SIMPLE_END: [{ target: 'NONE' }]
              }
            },
            COMPLEX: {
              on: {
                A2_EVENT_COMPLEX_END: [{ target: 'NONE' }]
              }
            }
          }
        },
        'A3 AMBIENCE': {
          initial: 'AMBIENCE',
          on: {
            A3_EVENT_SIMPLE_START: [{ target: '#Exit10.NORMAL.A3 Events.SIMPLE' }],
            A3_EVENT_COMPLEX_START: [{ target: '#Exit10.NORMAL.A3 Events.COMPLEX' }]
          },
          states: {
            AMBIENCE: {
              on: {
                A3_ONTOP_START: [{ target: 'ON TOP' }],
                A3_FULLSCREEN_START: [{ target: 'FULL SCREEN' }]
              }
            },
            'ON TOP': {
              on: {
                A3_ONTOP_END: [{ target: 'AMBIENCE' }]
              }
            },
            'FULL SCREEN': {
              on: {
                A3_FULLSCREEN_END: [{ target: 'AMBIENCE' }]
              }
            }
          }
        },
        'A3 Events': {
          initial: 'NONE',
          states: {
            NONE: {},
            SIMPLE: {
              on: {
                A3_EVENT_SIMPLE_END: [{ target: 'NONE' }]
              }
            },
            COMPLEX: {
              on: {
                A3_EVENT_COMPLEX_END: [{ target: 'NONE' }]
              }
            }
          }
        },
        LANDSCAPE: {
          type: 'parallel',
          states: {
            LIGHTING: {
              initial: 'AMBIENCE',
              states: {
                AMBIENCE: {}
              }
            },
            AUDIO: {
              initial: 'BGM',
              states: {
                BGM: {
                  on: {
                    LS_AUDIO_SPECIAL: [{ target: 'SPECIAL' }],
                    LS_AUDIO_NONE: [{ target: 'NONE' }]
                  }
                },
                SPECIAL: {
                  on: {
                    LS_AUDIO_NONE: [{ target: 'NONE' }],
                    LS_AUDIO_BGM: [{ target: 'BGM' }]
                  }
                },
                NONE: {
                  on: {
                    LS_AUDIO_BGM: [{ target: 'BGM' }],
                    LS_AUDIO_SPECIAL: [{ target: 'SPECIAL' }]
                  }
                }
              }
            }
          }
        }
      }
    },
    SHOW: {
      entry: { type: 'emitShowStarted' },
      exit: { type: 'emitShowEnded' },
      on: {
        GOTO_IDLE: [{ target: 'IDLE' }],
        SHOW_END: [{ target: 'NORMAL' }]
      }
    }
  }
});
