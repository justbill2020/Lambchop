const MATERIAL_PROGRESS_TYPES = new Set([
  'story_outcome_accepted',
  'mission_outcome_accepted',
  'validation_passed',
  'blocker_surfaced',
  'throughput_improved',
]);

export function createMaterialProgressController() {
  return {
    evaluate({ evidence }) {
      const materialProgressCount = evidence.filter((event) => MATERIAL_PROGRESS_TYPES.has(event.type)).length;
      const wheelSpinSignals = {
        meetingWithoutOutputStreak: evidence.filter((event) => event.type === 'meeting_completed' && event.hasOutput === false).length,
        docOnlyStreak:
          materialProgressCount === 0 && evidence.some((event) => event.type === 'doc_updated') ? 1 : 0,
        validationDrought: !evidence.some((event) => event.type === 'validation_passed'),
        staleActiveMission: evidence.some((event) => event.type === 'mission_active' && event.stale === true),
        repeatedReplanLoop: evidence.some((event) => event.type === 'replan_requested' && event.repeated === true),
      };

      return {
        materialProgressCount,
        wheelSpinSignals,
        result: materialProgressCount > 0 ? 'pass' : 'fail',
      };
    },
  };
}
