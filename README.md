# 🌐 Nour — Tunisia Outage Map

> **Know what's happening around you. Report outages. Help your community.**

Nour (نور) is a **real-time collaborative web platform** designed to help people across Tunisia report and monitor **electricity and water outages**.

Instead of relying only on official announcements or asking people in the neighborhood, Nour allows users to see nearby reports on a live map and quickly understand whether an outage is affecting only them or a wider area.

🌐 **Live Demo:** https://fedi-mhadhbi.github.io/nour-outage-map/

---

## 🇹🇳 Why Nour?

Power and water outages can affect households, neighborhoods, and entire areas. One of the main difficulties during an outage is simply knowing:

> **"Is the problem only here, or is everyone around me affected?"**

Nour provides a community-driven solution where users can report the current situation from their location and see reports from other people nearby in real time.

The goal is simple:

**Report → Share → Understand → Stay informed**

---

## ✨ Features

### 🗺️ Real-Time Outage Map

* Interactive map centered on Tunisia
* View nearby outage reports
* See reports based on their geographic location
* Updates appear in real time
* Location-based reporting

### ⚡ Electricity Reports

Users can report situations such as:

* 🔴 **No power here**
* 🟢 **Power's back**

This helps the community understand the current electricity situation in a specific area.

### 💧 Water Outage Reports

Nour also supports reporting **water outages**, allowing users to communicate water availability in their area.

### 📍 Location-Based Reporting

Reports are associated with the location where they were submitted, helping users identify affected areas and understand the geographic scope of an outage.

### 🧩 Smart Report Clustering

Instead of displaying many overlapping markers when several people report the same outage, nearby reports can be **grouped by area**.

This keeps the map easier to understand while still representing multiple community reports.

### 🔄 Contradictory Reports

When reports from the same area indicate different situations, Nour can identify the area as having a **mixed status** rather than incorrectly assuming that everyone has the same situation.

This helps represent real-world conditions where an outage may affect only part of an area.

### 🚨 Emergency Alerts

Nour includes an emergency alert feature designed to help communicate important situations to users.

The feature can be used to highlight urgent situations where people may need assistance or immediate awareness.

### 📱 Progressive Web App

Nour includes **PWA capabilities**, allowing users to install the application on compatible devices and use it with an app-like experience.

### 🇹🇳 Tunisia-Only Reporting

The reporting system is restricted to locations within Tunisia to keep reports relevant to the platform's purpose.

---

## 🛠️ Tech Stack

| Layer               | Technologies                      |
| ------------------- | --------------------------------- |
| **Frontend**        | HTML5, CSS3, JavaScript           |
| **Backend / Data**  | Firebase                          |
| **Database**        | Cloud Firestore                   |
| **Hosting**         | GitHub Pages                      |
| **Maps**            | Interactive mapping / geolocation |
| **Application**     | Progressive Web App (PWA)         |
| **Version Control** | Git, GitHub                       |

---

## 🏗️ How It Works

```text
User
  │
  ▼
Open Nour
  │
  ├── View live outage map
  │
  ├── Submit outage report
  │       │
  │       ▼
  │   Geolocation
  │       │
  │       ▼
  │   Firebase / Firestore
  │
  ▼
Nearby users receive updated information
```

Nour uses a cloud-based architecture so that reports can be shared between users without requiring a traditional server running locally.

---

## 📊 Reporting Logic

Nour is designed around **community-generated reports**.

For example:

```text
User A → No Power
User B → No Power
User C → No Power
User D → Power's Back
```

Instead of simply displaying four independent markers, the platform can represent the area as a **mixed situation**, giving users more context about what is happening nearby.

This approach helps reduce duplicate visual information while preserving the fact that different users may experience different conditions.

---

## 🔥 Firebase

Firebase is used to provide the cloud infrastructure required for the application's real-time functionality.

The project uses Firebase services for:

* Real-time data synchronization
* Firestore database
* Hosting-related integration
* Application data management

---

## 📱 Progressive Web App

Nour is designed as a Progressive Web App, providing features such as:

* Installable web application
* App-like experience
* Custom application icon
* Responsive interface
* Mobile-friendly access

---

## 🚀 Getting Started

### Prerequisites

You only need:

* A modern web browser
* Git
* A Firebase project if you want to run your own backend instance

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Fedi-Mhadhbi/nour-outage-map.git
cd nour-outage-map
```

**2. Configure Firebase**

Create your own Firebase project and configure the required Firebase services.

Add your Firebase configuration according to the project's configuration structure.

> Do not commit private credentials, service-account files, or other sensitive configuration to the repository.

**3. Run the project**

Because Nour is a web application, it can be served using a local development server or deployed through a static hosting service.

---

## 🔐 Security & Privacy

Nour is designed to minimize unnecessary sensitive information collection.

Important security considerations include:

* Firebase security rules should restrict unauthorized database operations
* Sensitive credentials should never be committed to GitHub
* User location data should be handled carefully
* Database permissions should follow the principle of least privilege
* Input validation should be applied to user-generated reports

> **Privacy Note:** Location-based applications should clearly communicate how location information is used and avoid collecting more information than necessary.

---

## 🎯 Future Improvements

* 📊 Outage statistics and historical data
* 🔔 Push notifications for nearby outages
* 🗺️ More advanced geographic clustering
* 📍 Improved location accuracy
* 🏘️ Neighborhood-level outage summaries
* 📈 Outage duration tracking
* 👥 Community verification of reports
* 🛡️ Improved abuse and false-report detection
* 📱 Further PWA improvements
* 🌐 Expansion to additional public-service incidents
* 🤖 AI-assisted report analysis

---

## 📸 Screenshots

Screenshots can be added here to showcase the main application interfaces.

Recommended screenshots:

* Main map
* Outage report interface
* Clustered reports
* Emergency alert
* Mobile/PWA interface

---

## 💡 Project Vision

Nour is built around a simple idea:

> **Information shared by a community can help a community respond better.**

By turning individual outage experiences into shared, real-time information, Nour aims to make it easier for people to understand what is happening around them and make better decisions during service interruptions.

---

## 👨‍💻 Author

**Fedi Mhadhbi**

Business Computing Student | Web Developer

Interested in **web development, cybersecurity, AI, cloud technologies, and emerging technologies**.

---

## 📄 License

This project is developed for **educational, experimental, and community-oriented purposes**.

---

⭐ **If you find Nour useful or interesting, consider giving the repository a star!**
