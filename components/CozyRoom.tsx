import React from 'react';

interface CozyRoomProps {
  hideFireplace?: boolean;
  hideLamp?: boolean;
}

export default function CozyRoom({ hideFireplace, hideLamp }: CozyRoomProps) {
  return (
    <>
      <div className="cozy-room" aria-hidden="true" />
      <div className="cozy-room__window" aria-hidden="true" />

      {/* Night: moon + stars */}
      <div className="cozy-room__moon" aria-hidden="true" />
      <div className="cozy-room__stars" aria-hidden="true">
        <i /><i /><i />
      </div>

      {/* Day: clouds */}
      <div className="cozy-room__cloud" aria-hidden="true" />
      <div className="cozy-room__cloud" aria-hidden="true" />

      {!hideLamp && (
        <div className="cozy-room__lamp" aria-hidden="true">
          <div className="cozy-room__lamp-shade" />
          <div className="cozy-room__lamp-base" />
        </div>
      )}

      {/* Night: fireplace */}
      {!hideFireplace && (
        <>
          <div className="cozy-room__fireplace" aria-hidden="true">
            <div className="cozy-room__hearth">
              <div className="cozy-room__logs" />
              <div className="cozy-room__flames">
                <div className="cozy-room__flame" />
                <div className="cozy-room__flame" />
                <div className="cozy-room__flame" />
                <div className="cozy-room__flame" />
              </div>
            </div>
          </div>
          <div className="cozy-room__embers" aria-hidden="true">
            <div className="cozy-room__ember-dot" />
            <div className="cozy-room__ember-dot" />
            <div className="cozy-room__ember-dot" />
            <div className="cozy-room__ember-dot" />
          </div>
        </>
      )}

      {/* Day: coffee mug */}
      <div className="cozy-room__coffee" aria-hidden="true">
        <div className="cozy-room__steam">
          <div className="cozy-room__steam-wisp" />
          <div className="cozy-room__steam-wisp" />
          <div className="cozy-room__steam-wisp" />
        </div>
        <div className="cozy-room__mug">
          <div className="cozy-room__mug-liquid" />
        </div>
        <div className="cozy-room__mug-handle" />
        <div className="cozy-room__mug-saucer" />
      </div>
    </>
  );
}
