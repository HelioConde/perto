// Read-only production smoke test. Uses the SAME public publishable key as the browser.
// Never provision users, write rows, reveal API credentials, or log private data.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const config=readFileSync(new URL('../supabase-config.js',import.meta.url),'utf8');
const origin=config.match(/https:\/\/[a-z0-9-]+\.supabase\.co/)?.[0];
const publishableKey=config.match(/sb_publishable_[a-zA-Z0-9_-]+/)?.[0];
assert.ok(origin&&publishableKey,'Public Supabase client configuration missing');

async function request(path,method='GET'){
  const response=await fetch(origin+path,{
    method,
    headers:{apikey:publishableKey,accept:'application/json',...(method==='POST'?{'content-type':'application/json'}:{})},
    ...(method==='POST'?{body:'{}'}:{}),
    signal:AbortSignal.timeout(15000)
  });
  const body=await response.text();
  return {status:response.status,body};
}
const publicRows=await request('/rest/v1/perto_professionals?select=id%2Cstatus&status=eq.active&limit=1');
assert.equal(publicRows.status,200,'Anonymous active-professional catalog should be readable');
const profiles=JSON.parse(publicRows.body);
assert.ok(Array.isArray(profiles),'Catalog response should be an array');
assert.ok(profiles.every(p=>p.status==='active'&&typeof p.id==='string'),'Public catalog must return active listings only');
console.log('PASS: anonymous active-professional catalog returns a valid response');

const privateQuotes=await request('/rest/v1/perto_requests?select=id&limit=1');
assert.ok([401,403,404].includes(privateQuotes.status),'Anonymous request inbox must not be accessible');
console.log('PASS: anonymous visitors cannot list private quotes');

const moderatorQueue=await request('/rest/v1/rpc/perto_pending_moderation','POST');
assert.ok([401,403,404].includes(moderatorQueue.status),'Anonymous visitors must not read the moderation queue');
console.log('PASS: anonymous visitors cannot read moderation queue');
