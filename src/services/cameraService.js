import { deleteCamera, fetchCameras, saveCamera } from "../api/cameraApi";

function displayYesNo(value, yesLabel, noLabel) {
  if (value === "Y") return yesLabel;
  if (value === "N") return noLabel;
  return "-";
}

export function toCameraRow(camera) {
  const useLabel = displayYesNo(camera.useYn, "사용", "미사용");
  const focusLabel = displayYesNo(camera.focusYn, "집중감시", "일반");
  return {
    id: camera.cameraId,
    time: camera.updateTime || camera.insertTime || "",
    plant: camera.factoryCd || "-",
    equipment: camera.cameraNm || camera.cameraId || "-",
    location: camera.installLoc || "-",
    status: useLabel,
    ...camera,
    "카메라ID": camera.cameraId || "-",
    "카메라명": camera.cameraNm || "-",
    "공장": camera.factoryCd || "-",
    "설치 위치": camera.installLoc || "-",
    "설비 코드": camera.equipCd || "-",
    "대상 설비": camera.equipCd || "-",
    "모델명": camera.modelNm || "-",
    "모델": camera.modelNm || "-",
    "IP": camera.ipAddr || "-",
    "IP 주소": camera.ipAddr || "-",
    "수신 유예시간(초)": camera.recvGraceSec ?? "-",
    "사용 여부": useLabel,
    "집중감시 여부": focusLabel,
    "감지구역 수": camera.zoneCnt ?? 0,
  };
}

function compareByInsertTime(left, right) {
  const leftValue = left.insertTime;
  const rightValue = right.insertTime;

  if (!leftValue && !rightValue) return 0;
  if (!leftValue) return -1;
  if (!rightValue) return 1;

  const leftTime = typeof leftValue === "number"
    ? leftValue
    : Date.parse(String(leftValue).replace(" ", "T"));
  const rightTime = typeof rightValue === "number"
    ? rightValue
    : Date.parse(String(rightValue).replace(" ", "T"));

  if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime)) return leftTime - rightTime;
  return String(leftValue).localeCompare(String(rightValue));
}

export async function getCameras(params) {
  const payload = await fetchCameras(params);
  return [...(payload?.data || [])]
    .sort(compareByInsertTime)
    .map(toCameraRow);
}

export async function removeCamera(params) {
  const payload = await deleteCamera(params);
  return {
    deactivated: payload.resultCd === 1,
    message: payload.resultMsg || "",
  };
}

export async function updateCamera(params) {
  const payload = await saveCamera(params);
  return payload.data;
}
