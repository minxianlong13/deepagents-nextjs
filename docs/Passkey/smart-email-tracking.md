# SMART Email Tracking — `emailtracking` Column Population

## How rows are created (all processors)

All processors call `TrackingFacadeLocal.generateTrackingID()` which calls
`SmartCampaignDAO.generateTrackingID()` (ejb) → stored proc **`PROC_CREATETRACKABLEEMAIL`**.
This inserts the `emailtracking` row **before** the email is sent.

- `ejb/.../dao/SmartCampaignDAO.java:398–448` — DAO method, proc call at line 412
- `ejb/.../facade/TrackingFacade.java:29–33` — facade wrapper

`lastsentdate` and `emailtrackingstatusid` are **not set at insert time**.
They are updated when the **tracking pixel fires** (recipient's mail client loads `pixel.gif`).

---

## Processor-by-processor

### 1. AcknowledgementTaskProcessor (acks — primary)
**Schedule:** every 1 min | **File:** `ejb/.../business/processor/AcknowledgementTaskProcessor.java`

- Line 54: `@Schedule(minute = "*/1")`
- Line 67: `acknowledgementTaskEJB.lockAndGet(10)` — fetches up to 10 pending ack tasks
- Line 77: `ackCampaignBO.evalAndRunCampaign(task)` — delegates to shared ack logic
- → `AckCampaignBO.java:92`: `smartCampaignTypeBO.execute()` — same path as campaigns (see §3)

### 2. AckCampaignProcessor (acks — retry)
**Schedule:** every 15 min | **File:** `ejb/.../business/processor/AckCampaignProcessor.java`

- Line 55: `@Schedule(minute = "*/15")`
- Line 75: `ackCampaignBO.sendAckCampaignFromDatabase()` — queries records >1hr old still pending/failed/stuck
- → `AckCampaignBO.java:156`: `evalAndRunCampaign()` → same as above

Both ack processors converge in **`AckCampaignBO.java`**:
- Line 44: `acknowledgementBO.saveResAckLog()` — writes to `resacknowledgementlog` (not `emailtracking`)
- Line 92: `smartCampaignTypeBO.execute()` — this is where `emailtracking` row gets created (see §3)

### 3. SmartCampaignMDB (marketing campaigns)
**Trigger:** JMS message on `smartCampaignQueue` | **File:** `ejb/.../business/ejb/SmartCampaignMDB.java`

- Line 44: `smartCampaignBO.evalAndRunCampaign(emailJMSMessageVO)`
- → `SmartCampaignTypeBO.java:727`: `fillTracking(...)` called before send
- → `SmartCampaignTypeBO.java:1376–1378`: `generateTrackingID()` only if `trackLinks || trackDelivery || trackReads`
- → `SmartCampaignTypeBO.java:628`: `trackableEmailJMSVO.setIncludeTrackingImage(true)` when `trackDelivery`
- → `SmartCampaignTypeBO.java:790`: `smartCampaignEmailSenderBO.sendEmail()`
- → `core/.../email/MailTransportWrapperImpl.java:389–410`: pixel appended to HTML body (`method=image&trkid=...&filename=/pixel.gif`)

### 4. SmartEmailProcessor — smartemails (alerts)
**Schedule:** every 1 hr | **File:** `ejb/.../smartemails/business/smartemailprocessor/SmartEmailProcessor.java`

- Calls `SmartEmailBO` directly (does **not** go through `SmartCampaignTypeBO`)
- `ejb/.../emailsender/SmartEmailBO.java:576–594`: `applyTracking()` called per recipient
- `SmartEmailBO.java:739`: `trackingFacadeLocal.generateTrackingID()` — same proc, same insert
- `SmartEmailBO.java:761`: `result += buildTrackingImg(trkId)` — pixel appended unconditionally
- `SmartEmailBO.java:780–789`: pixel built with `method=image&trkid=...&filename=/pixel.gif`

---

## Summary of column sources

| Column | Set by | When |
|---|---|---|
| `emailtrackingid` | `PROC_CREATETRACKABLEEMAIL` | Before send |
| `lastsentdate` | Tracking pixel callback (`method=image`) | When recipient's client loads the pixel |
| `emailtrackingstatusid` | Tracking pixel callback | Same as above |
| `readcount` | Tracking pixel callback | Same as above |

**Removing the tracking pixel removes the only mechanism that sets `lastsentdate`.**
To preserve a send timestamp without a pixel, `PROC_CREATETRACKABLEEMAIL` would need to set
`lastsentdate` at insert time, or an explicit update must follow `sendEmail()` in
`SmartCampaignTypeBO.java:790` (campaigns/acks) and `SmartEmailBO.java:576–594` (alerts).
