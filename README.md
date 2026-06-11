# Projektauftrag – Diplomarbeit

## Projekttitel

**Smart Car Expense Manager – Intelligente Verwaltung gemeinsamer Fahrzeugkosten mit KI-gestützter Rechnungserkennung und Schuldenoptimierung**

### 1. Ausgangssituation / Problemstellung

In Wohngemeinschaften, Familien oder Freundesgruppen wird häufig ein Fahrzeug gemeinsam genutzt. Dabei entstehen laufend Kosten wie Treibstoff, Versicherung, Service, Reparaturen, Pickerl (§57a), Reifenwechsel, Parkgebühren oder Autobahnvignetten.

Die Verwaltung dieser Ausgaben erfolgt meist über Nachrichten, Tabellen oder mündliche Absprachen. Dadurch entsteht oft Unklarheit darüber, wer welche Kosten bereits bezahlt hat und welcher Betrag von den anderen Nutzern noch auszugleichen ist.

Besonders bei langfristiger gemeinsamer Nutzung eines Fahrzeugs wird die Berechnung der tatsächlichen Kostenanteile schnell unübersichtlich und fehleranfällig.

### 2. Projektziel

Ziel des Projekts ist die Entwicklung einer Softwarelösung zur Verwaltung gemeinsamer Fahrzeugkosten.

Die Anwendung soll alle fahrzeugbezogenen Ausgaben zentral erfassen und automatisch auf die beteiligten Personen aufteilen. Zusätzlich soll ein Optimierungsalgorithmus berechnen, welche Personen anderen Nutzern Geld schulden und wie diese Schulden mit möglichst wenigen Überweisungen beglichen werden können.

Ein besonderes Merkmal der Anwendung ist die Integration von künstlicher Intelligenz zur automatischen Rechnungserkennung und Analyse von Fahrzeugkosten.

### 3. Projektumfang

Im Rahmen des Projekts soll eine Anwendung entwickelt werden, die folgende Funktionen umfasst:

#### Benutzerverwaltung

* Registrierung und Anmeldung von Benutzern
* Verwaltung persönlicher Profile

#### Fahrzeugverwaltung

* Anlegen eines oder mehrerer gemeinsamer Fahrzeuge
* Verwaltung von Fahrzeugdaten
* Zuweisung von Benutzern zu Fahrzeugen

#### Kostenverwaltung

* Erfassung von Fahrzeugkosten
* Kategorien wie:

  * Tanken
  * Versicherung
  * Service
  * Reparaturen
  * Pickerl (§57a)
  * Reifen
  * Parkgebühren
  * Vignette
  * Sonstige Kosten
* Speicherung der Ausgabenhistorie

#### Kostenaufteilung

* Gleichmäßige oder individuelle Aufteilung von Kosten
* Berücksichtigung unterschiedlicher Nutzungsanteile

#### Schuldenberechnung

* Berechnung individueller Kostenanteile
* Übersicht offener Forderungen und Verbindlichkeiten

#### Schuldenoptimierung

* Algorithmus zur Minimierung der notwendigen Rückzahlungen
* Berechnung optimaler Zahlungsflüsse zwischen den Nutzern

#### KI-Rechnungserkennung

* Hochladen oder Fotografieren von Rechnungen
* OCR-Texterkennung zur Extraktion von Rechnungsdaten
* Automatische Erkennung von:

  * Betrag
  * Datum
  * Händler/Werkstatt
  * Rechnungsart
* Automatische Zuordnung zu einer passenden Kostenkategorie
* Übernahme der erkannten Daten in das System

#### KI-Kostenanalyse

* Analyse aller erfassten Fahrzeugkosten
* Automatische Zusammenfassungen der Ausgaben
* Erkennung von Kostenentwicklungen und Trends
* Erstellung von Hinweisen wie:

  * „Die Tankkosten sind im Vergleich zum Vormonat gestiegen.“
  * „Reparaturen verursachen aktuell den größten Kostenanteil.“
  * „Die durchschnittlichen Fahrzeugkosten betragen 380 € pro Monat.“

#### Statistik und Auswertung

* Übersicht der Gesamtkosten
* Ausgaben nach Kategorien
* Kostenentwicklung über Zeiträume
* Individuelle Kostenanteile pro Nutzer
* Grafische Darstellung wichtiger Kennzahlen

### 4. Technische Umsetzung

#### Backend

* ASP.NET Core Web API (.NET)

#### Frontend

* Mobile App mit .NET MAUI
  oder
* Webanwendung mit Blazor

#### Datenbank

* Microsoft SQL Server

#### Weitere Technologien

* Entity Framework Core
* REST-API zur Kommunikation zwischen Client und Server
* OCR-Technologie zur Rechnungserkennung
* KI-Modell oder AI-Service zur Analyse und Kategorisierung von Rechnungsdaten
* Diagramm-Komponenten für statistische Auswertungen

### 5. Ergebnisse des Projekts

Am Ende des Projekts sollen folgende Ergebnisse vorliegen:

* Funktionsfähige Anwendung zur Verwaltung gemeinsamer Fahrzeugkosten
* Implementierung eines Algorithmus zur Schuldenoptimierung
* KI-gestützte Rechnungserkennung mittels OCR
* Automatische Analyse und Zusammenfassung von Fahrzeugkosten
* Statistische Auswertungen und Visualisierungen
* Dokumentation der Softwarearchitektur und Implementierung
* Präsentation und Demonstration der Anwendung

### 6. Nutzen des Projekts

Die entwickelte Anwendung ermöglicht eine transparente und faire Verwaltung gemeinsamer Fahrzeugkosten. Nutzer erhalten jederzeit einen Überblick über bereits bezahlte Ausgaben, offene Schulden und notwendige Ausgleichszahlungen.

Durch die Integration künstlicher Intelligenz werden Rechnungen automatisch verarbeitet und Kostenentwicklungen analysiert. Dadurch wird der Verwaltungsaufwand reduziert und die gemeinsame Nutzung eines Fahrzeugs deutlich vereinfacht.

Darüber hinaus demonstriert das Projekt den praktischen Einsatz moderner Softwaretechnologien, Datenbankentwicklung, REST-Architekturen, algorithmischer Optimierung sowie künstlicher Intelligenz in einem realen Anwendungsszenario.

### 7. Projektzeitraum

Der Projektzeitraum entspricht dem vorgesehenen Zeitraum der Diplomarbeit und umfasst Analyse, Konzeption, Implementierung, Testphase und Dokumentation.

## Projektteam

[Fawad, Sebi, Emily]

## Auftraggeber

Abendschule HTL Leonding – Fach: Systemprojektplanung

## Betreuer

Prof. David Klewein
