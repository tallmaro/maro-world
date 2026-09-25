import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createMusic } from '../public/src/music.js';
import { places, courses } from '../public/src/places.js';

function setup(){const dom=new JSDOM('<div id="music"></div>',{url:'http://127.0.0.1:4390'});const element=dom.window.document.querySelector('div');return {dom,element,music:createMusic(element,dom.window)};}
test('no third-party resource exists until the separate load-player action',()=>{
  const {dom,element,music}=setup();music.setPlace(places[0]);
  assert.equal(element.querySelectorAll('iframe,audio,video,img,script,link').length,0);
  element.querySelector('[data-music-toggle]').click();assert.equal(element.querySelectorAll('iframe').length,0);
  element.querySelector('[data-music-load]').click();
  const frame=element.querySelector('iframe');assert.ok(frame);assert.equal(new URL(frame.src).searchParams.has('autoplay'),false);
  element.querySelector('[data-music-load]').click();assert.equal(element.querySelectorAll('iframe').length,1);
  music.dispose();dom.window.close();
});
test('exact recording and one-place lifecycle, close, offline, reconnect and pagehide',()=>{
  const {dom,element,music}=setup();
  const urls=['https://open.spotify.com/embed/track/72aZrJKq734qOVBMUpBd0L?utm_source=oembed','https://embed.music.apple.com/us/album/bonnie-and-clyde/1399045396?i=1399045963','https://www.youtube-nocookie.com/embed/oorVWW9ywG0?playsinline=1&rel=0','https://open.spotify.com/embed/track/4wajJ1o7jWIg62YqpkHC7S?utm_source=oembed'];
  for(let i=0;i<places.length;i++){
    music.setPlace(places[i]);assert.equal(element.querySelectorAll('iframe').length,0);
    element.querySelector('[data-music-toggle]').click();element.querySelector('[data-music-load]').click();assert.equal(element.querySelector('iframe').src,urls[i]);
    assert.equal(element.querySelector('iframe').referrerPolicy,urls[i].includes('youtube')?'strict-origin-when-cross-origin':'no-referrer','only YouTube needs the origin');
  }
  element.querySelector('[data-music-close]').click();assert.equal(element.querySelectorAll('iframe').length,0);
  element.querySelector('[data-music-toggle]').click();element.querySelector('[data-music-load]').click();
  dom.window.dispatchEvent(new dom.window.Event('offline'));assert.equal(element.querySelectorAll('iframe').length,0);
  dom.window.dispatchEvent(new dom.window.Event('online'));assert.equal(element.querySelectorAll('iframe').length,0);
  element.querySelector('[data-music-load]').click();dom.window.dispatchEvent(new dom.window.Event('pagehide'));assert.equal(element.querySelectorAll('iframe').length,0);
  music.setPlace(null);assert.equal(element.textContent,'');music.dispose();dom.window.close();
});
test('library shelves contain real course titles and no invented personal takeaways',()=>{
  assert.ok(courses.some(c=>c.title==='Game Theory and Mechanism Design'));
  assert.ok(courses.some(c=>c.title==='Mathematical Modelling in Machine Learning'));
  assert.ok(courses.every(c=>c.takeaway===null));
});
