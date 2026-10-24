import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liveMap } from '../public/itsm-map.js';
test('park animation markup follows actual fault, acknowledgment and verified closure',()=>{
  const fault=liveMap([],['queue','fence'],null,false,[{ack_at:null,resolved_at:null}]);
  assert.match(fault,/turnstile-stopped/);assert.match(fault,/ALAN KAPALI/);
  assert.equal((fault.match(/queue-person/g)||[]).length,24);
  assert.doesNotMatch(fault,/response-team|recovery-banner/);
  const response=liveMap([],['queue'],null,false,[{ack_at:1,resolved_at:null}]);
  assert.match(response,/response-team/);assert.doesNotMatch(response,/recovery-banner/);
  const recovered=liveMap([],[],null,false,[{ack_at:1,resolved_at:2}]);
  assert.match(recovered,/turnstile-open/);assert.match(recovered,/recovery-banner/);
  assert.doesNotMatch(recovered,/queue-person|ALAN KAPALI|response-team/);
});
