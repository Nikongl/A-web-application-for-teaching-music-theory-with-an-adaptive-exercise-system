import React from "react";

export default function ModeSelectPage({ onSelectMode }) {
  return (
    <div className="page">
      <h1>Выбери режим</h1>
      <button onClick={onSelectMode}>🤖 Адаптивный</button>
      <button onClick={onSelectMode}>🎯 Свободный</button>
    </div>
  );
}