const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { log } = require('../logging');
const { checkRoom, deleteRoom, launchRoom } = require('./conferencing');

const handleItemUpdate = functions.firestore
  .document('courses/{courseUid}/items/{itemUid}')
  .onUpdate(async (change, context) => {
    const { courseUid, itemUid } = context.params;
    log({ message: `Item ${itemUid} has been updated.`, data: change.after.data(), context });

    const oldValue = change.before.data();
    const newValue = change.after.data();

    // If we move from 'scheduled' to 'initializing', start a room.
    if (oldValue.status === 'scheduled' && newValue.status === 'initializing') {
      const update = {};

      const existingRoom = await checkRoom({ name: itemUid });
      if (!existingRoom.error) {
        // The room already exists, which means something is screwed up before now.
        log({ message: 'Room already exists.', data: existingRoom, context, level: 'warning' });
        update.room = existingRoom;
      } else {
        // The room does not exist. Create it.
        log({ message: 'Attempting to launch room...', data: change.after.data(), context });
        const newRoom = await launchRoom({ name: itemUid });
        if (newRoom.error) {
          // There was a problem creating the room.
          // Change back to previous status.
          update.status = 'scheduled';
          log({ message: newRoom.error, data: newRoom, context, level: 'error' });
        } else {
          update.room = newRoom;
          update.status = 'live';
          update.started = admin.firestore.Timestamp.now();
          log({ message: 'Successfully launched room.', data: newRoom, context });
        }
      }

      // Update record.
      const ref = admin.firestore()
        .collection('courses').doc(courseUid)
        .collection('items').doc(itemUid);
      await ref.update(update);

      // If we move from 'live' to 'uploading', delete a room.
    } else if (oldValue.status === 'live' && newValue.status === 'uploading') {
      const update = { started: false };

      // Does it exist?
      const existingRoom = await checkRoom({ name: itemUid });
      if (existingRoom.error) {
        // It does not exist, which is a problem somewhere else.
        // Still, we can delete it.
        log({ message: 'Attempted to delete a room that does not exist.', data: existingRoom, context, level: 'error' });
        update.room = false;
      } else {
        // It exists. Delete it.
        const room = await deleteRoom({ name: itemUid });
        if (room.error) {
          // There was a problem deleting the (existing) room.
          // That means we're still live.
          log({ message: 'Could not delete existing room.', data: room, context, level: 'error' });
          update.status = 'live';
        } else {
          // We successfully deleted the room. Update the record.
          log({ message: 'Successfully deleted room.', data: room, context });
          update.room = false;
        }
      }

      const ref = admin.firestore()
        .collection('courses').doc(courseUid)
        .collection('items').doc(itemUid);
      await ref.update(update);

      // Stop counting and subtract time from what user has left.
      const then = oldValue.started.toDate();
      const now = admin.firestore.Timestamp.now().toDate();
      const used = now - then;

      const { creatorUid } = oldValue;
      const user = await admin.auth().getUser(creatorUid);
      const { remaining = 0 } = user.customClaims;

      log({ message: 'Updated item based on room result.', data: update, context });
    }
  });

// TODO Can't test these right now.
const handleFileUpload = functions.storage
  .bucket('coach-yard-uploads')
  .object()
  .onFinalize(async (object, context) => {
    console.log('uploaded', object.name);
  });

const handleFileDelete = functions.storage
  .bucket('coach-yard-uploads')
  .object()
  .onDelete((object, context) => {
    console.log('deleted', object.name);
  });

module.exports = {
  handleItemUpdate
};
