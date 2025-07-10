

/**
 * Returns the default hourly price based on the time of day.
 * @param time - The time string in "HH:mm" format.
 * @returns The default price for the given time slot.
 */
export function getDefaultPrice(time: string): number {
  const hour = parseInt(time.split(':')[0], 10);

  if (hour >= 7 && hour < 12) {
    // Morning slot (7am - 11am)
    return 6000;
  } else if (hour >= 14 && hour < 18) {
    // Afternoon slot (2pm - 5pm)
    return 7000;
  } else {
    // Evening slot (6pm onwards)
    return 8000;
  }
}

    