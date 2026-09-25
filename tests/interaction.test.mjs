import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createLandmark } from '../public/assets/library/landmark.js';
import { libraryAction } from '../public/src/assets.js';
test('source study-table metadata routes to a table close-up, not the entrance',()=>{
  const library=createLandmark(THREE);
  assert.equal(libraryAction(library.getObjectByName('study-table-01').userData.type),'table');
  assert.equal(libraryAction(library.getObjectByName('bookshelf-01').userData.type),'shelf');
  assert.equal(libraryAction(library.getObjectByName('library-entrance').userData.type),'entrance');
});
