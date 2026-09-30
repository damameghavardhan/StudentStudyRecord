# StudyTracker

StudyTracker is a polished, responsive personal learning dashboard for recording study time, tracking completed topics, and building consistent study habits. It runs entirely in your browser, with no account or backend required.

## Features

- Log study sessions from 0.1 to 24 hours and review today's and all-time totals.
- Add and remove completed topics, with automatic progress toward a 20-topic goal.
- Calculate current and longest daily study streaks from logged sessions.
- Review recent study history and delete sessions to correct your records.
- Unlock five milestones automatically: Beginner Learner, Consistent Learner, 7 Day Streak, 30 Day Streak, and Study Master.
- Switch between light and dark themes; theme and learning data persist in local storage.
- Responsive dashboard, daily motivational quote, accessible status messages, and reduced-motion support.

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Browser Local Storage
- Lucide icons and Google Fonts (loaded from their CDNs when online)

## Installation

1. Download or clone this project.
2. Open `index.html` in a modern browser. No package installation or build step is required.
3. For a local web server, run this from the project directory:

	```bash
	python -m http.server 8000
	```

4. Visit `http://localhost:8000`.

Your study data is stored in the current browser and device. Clearing browser site data will remove it. Keep personal exports or backups separately if you need them.

## Screenshots

Add dashboard screenshots to this section when available.

## Future Improvements

- Export and import study data as JSON or CSV.
- Add custom learning goals and configurable achievement milestones.
- Provide weekly and monthly study summaries.
- Add optional cloud sync and multi-device accounts.

## Data and Privacy

Study sessions, topics, and theme preference are stored locally in your browser. No backend service receives this data. Google Fonts and Lucide are fetched from CDNs when a network connection is available; the dashboard's core tracking features do not depend on them.
