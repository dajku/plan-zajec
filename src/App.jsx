import React, { useEffect, useMemo, useState } from 'react';
import { parseSchedule, subjectsNeedingSelection, filterEntriesForUser, NOT_ATTENDING } from './lib/scheduleParser.js';
import { loadStoredSchedule, saveStoredSchedule, loadSelections, saveSelections, clearAll } from './lib/storage.js';
import { BUNDLED_CSV, BUNDLED_FILE_NAME, BUNDLED_AS_OF } from './data/bundledSchedule.js';
import { FileImport } from './components/FileImport.jsx';
import { GroupSelection } from './components/GroupSelection.jsx';
import { DailyView } from './components/DailyView.jsx';
import { SettingsScreen } from './components/SettingsScreen.jsx';

const bundledParsed = parseSchedule(BUNDLED_CSV);
const bundled = {
  csvText: BUNDLED_CSV,
  fileName: BUNDLED_FILE_NAME,
  asOf: BUNDLED_AS_OF,
  title: bundledParsed.meta.title,
  entryCount: bundledParsed.entries.length,
  firstDate: bundledParsed.meta.firstDate,
  lastDate: bundledParsed.meta.lastDate,
};

function restore() {
  const stored = loadStoredSchedule();
  if (!stored) return { screen: 'import', schedule: null, selections: {} };
  try {
    const parsed = parseSchedule(stored.csvText);
    const selections = loadSelections();
    const pending = subjectsNeedingSelection(parsed.subjects, selections);
    return {
      screen: pending.length === 0 ? 'ready' : 'onboarding',
      schedule: { ...stored, parsed },
      selections,
    };
  } catch {
    clearAll();
    return { screen: 'import', schedule: null, selections: {} };
  }
}

export default function App() {
  const [state, setState] = useState(restore);
  const { screen, schedule, selections } = state;

  useEffect(() => {
    if (schedule) saveSelections(selections);
  }, [schedule, selections]);

  function onLoaded({ csvText, parsed, source, fileName }) {
    saveStoredSchedule({ csvText, source, fileName });
    // Keep selections that still make sense for the new file; drop the rest.
    const previous = loadSelections();
    const kept = {};
    for (const s of parsed.subjects) {
      const v = previous[s.name];
      if (v !== undefined && (v === NOT_ATTENDING || s.groups.includes(v))) kept[s.name] = v;
    }
    const pending = subjectsNeedingSelection(parsed.subjects, kept);
    setState({
      screen: pending.length === 0 && parsed.subjects.length > 0 ? 'ready' : 'onboarding',
      schedule: { csvText, source, fileName, parsed },
      selections: kept,
    });
  }

  const subjectsToAsk = useMemo(
    () => (schedule ? schedule.parsed.subjects.filter((s) => !s.wholeYearOnly) : []),
    [schedule],
  );
  const wholeYearOnly = useMemo(
    () => (schedule ? schedule.parsed.subjects.filter((s) => s.wholeYearOnly) : []),
    [schedule],
  );

  const mine = useMemo(
    () => (schedule ? filterEntriesForUser(schedule.parsed.entries, selections) : []),
    [schedule, selections],
  );

  if (screen === 'import' || !schedule) {
    return <FileImport bundled={bundled} onLoaded={onLoaded} />;
  }

  if (screen === 'onboarding') {
    return (
      <GroupSelection
        subjects={subjectsToAsk}
        wholeYearOnly={wholeYearOnly}
        selections={selections}
        planTitle={schedule.parsed.meta.title}
        onChange={(next) => setState((s) => ({ ...s, selections: next }))}
        onDone={() => setState((s) => ({ ...s, screen: 'ready' }))}
        onCancel={() => setState((s) => ({ ...s, screen: 'import' }))}
      />
    );
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        schedule={schedule}
        selections={selections}
        entryCount={mine.length}
        onBack={() => setState((s) => ({ ...s, screen: 'ready' }))}
        onEditGroups={() => setState((s) => ({ ...s, screen: 'onboarding' }))}
        onChangeFile={() => setState((s) => ({ ...s, screen: 'import' }))}
      />
    );
  }

  return (
    <DailyView
      entries={mine}
      planTitle={schedule.parsed.meta.title}
      onOpenSettings={() => setState((s) => ({ ...s, screen: 'settings' }))}
    />
  );
}
