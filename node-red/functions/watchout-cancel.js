/**
 * Watchout Discovery Cancel — Node-RED Function Node
 *
 * Wire this node from a dashboard [Cancel] button.
 * Clears the pending mapping without saving anything.
 *
 * Flow context variables modified:
 *   flow.set('watchout_pending', null)
 *
 * Output msg.payload:
 *   { status: 'cancelled' }
 */

'use strict';

flow.set('watchout_pending', null);

node.send({ payload: { status: 'cancelled' }, topic: 'watchout/cancel' });

return null;
