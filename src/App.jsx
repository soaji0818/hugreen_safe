import { useMemo, useState } from 'react'
import './App.css'

const groups = [
  {name:'스마트 안전관리', icon:'◇', items:[
    ['MES-TD3-007','작업자 접근 이벤트 조회'],['MES-TD3-008','안전 로그 조회'],['MES-TD3-009','안전 이벤트 처리이력 관리'],
    ['MES-TD3-010','점검 문서·목차 관리'],['MES-TD3-011','점검 결과 입력·승인'],['MES-TD3-012','점검 이력·보관 관리'],
    ['MES-TD3-013','위험구역 접근 이벤트 수집'],['MES-TD3-014','위험 경보 발송'],['MES-TD3-015','위험 이벤트 관리'],
  ]},
  {name:'AI CCTV 관리', icon:'◉', items:[
    ['MES-TD3-016','AI CCTV 기준정보 관리'],['MES-TD3-017','AI CCTV 상태 모니터링'],['MES-TD3-018','AI CCTV 이벤트 수집'],
    ['MES-TD3-019','현장 경고·경보 이력관리'],['MES-TD3-020','장비별 이벤트 조회'],['MES-TD3-021','이벤트 안전점검일지 연계'],['MES-TD3-022','장비 이벤트 장애관리'],
  ]},
  {name:'시스템 관리', icon:'⚙', items:[
    ['MES-TD3-001','이벤트 클립 추출'],['MES-TD3-002','영상 이력 검색'],['MES-TD3-003','AI 학습데이터 관리'],
    ['MES-TD3-004','MES/NVR/VMS 연계관리'],['MES-TD3-005','설비 연계 상태 로그 관리'],['MES-TD3-006','PLC·MES 연계관리'],
  ]},
]

const eventRows = [
  {id:'EVT-261008-042',time:'2026-10-08 14:32:18',plant:'광주 1공장',equipment:'프레스 6000',location:'C동 1층',type:'위험구역 접근',level:'위험',status:'미확인'},
  {id:'EVT-261008-041',time:'2026-10-08 14:18:46',plant:'광주 1공장',equipment:'샤링기',location:'C동 1층',type:'안전모 미착용',level:'주의',status:'조치중'},
  {id:'EVT-261008-040',time:'2026-10-08 13:55:02',plant:'광주 1공장',equipment:'프레스 3000',location:'C동 1층',type:'라이트커튼 차단',level:'위험',status:'확인'},
  {id:'EVT-261008-039',time:'2026-10-08 13:21:39',plant:'광주 1공장',equipment:'도장 부스',location:'B동 2층',type:'환경 기준 초과',level:'주의',status:'조치완료'},
  {id:'EVT-261008-038',time:'2026-10-08 12:48:11',plant:'광주 1공장',equipment:'지게차 2호',location:'A동 출하장',type:'지게차 접근',level:'주의',status:'오탐 종결'},
]

const specific = {
  'MES-TD3-001':{filters:['기간','공장','카메라','이벤트 유형'],cols:['이벤트ID','수신일시','공장','카메라','이벤트 유형','스냅샷 수'],detail:'snap'},
  'MES-TD3-002':{filters:['기간','공장','카메라(구역)','이벤트 유형'],cols:['이벤트ID','발생일시','공장','구역','이벤트 유형','영상'],detail:'snap',download:true},
  'MES-TD3-003':{filters:['기간','카메라','이벤트 유형','후보 상태'],cols:['후보번호','등록일','이벤트ID','카메라','이벤트 유형','등록 사유','후보 상태','반영 모델 버전'],detail:'form'},
  'MES-TD3-004':{filters:['공장','연계 대상','데이터 유형'],cols:['카메라ID','카메라명','공장','연계 대상','데이터 유형','연계 상태','최근 연계시각']},
  'MES-TD3-005':{filters:['기간','장비','로그 유형'],cols:['로그번호','발생일시','연계 대상','장비','로그 유형','결과','오류 내용'],detail:'log'},
  'MES-TD3-006':{filters:['공장','설비','센서 유형'],cols:['센서ID','센서명','센서 유형','공장','설치 설비','통신 방식','PLC 입력주소','연계 상태','최종 수신시각'],detail:'sensor'},
  'MES-TD3-007':{filters:['기간','공장','설비','센서','이벤트 유형'],cols:['발생일시','해제일시','센서ID','센서 유형','공장','설비','이벤트 유형']},
  'MES-TD3-008':{filters:['기간','공장','발생원','이벤트 유형'],cols:['이벤트ID','발생일시','공장','설비','위치','이벤트 유형','발생원'],detail:'log'},
  'MES-TD3-009':{filters:['기간','공장','설비','처리 상태'],cols:['이벤트ID','발생일시','이벤트 유형','처리 전','처리 후','처리자','처리일시']},
  'MES-TD3-010':{filters:['문서 구분','사용 여부'],cols:['목차 코드','점검 문서','점검 항목','입력 방식','정렬 순서'],detail:'tree'},
  'MES-TD3-011':{filters:['점검일자','점검 문서','설비','승인 상태'],cols:['점검번호','점검일자','문서명','설비','점검자','승인 상태'],detail:'inspection',approve:true},
  'MES-TD3-012':{filters:['기간','점검 문서','설비','보관 상태'],cols:['점검번호','점검일자','문서명','설비','승인자','보관 상태'],detail:'form'},
  'MES-TD3-013':{filters:['기간','공장','카메라','감지구역 유형'],cols:['수집번호','발생일시','카메라','위치','감지구역','이벤트 유형','수집 결과']},
  'MES-TD3-014':{filters:['기간','발송 주체','위험 단계','발송 결과'],cols:['발송번호','이벤트ID','발송일시','발송 주체','경보 방식','위험 단계','발송 결과']},
  'MES-TD3-015':{filters:['기간','공장','설비','이벤트 유형','처리 상태'],cols:['이벤트ID','발생일시','공장','설비','이벤트 유형','위험 단계','처리 상태','담당자'],detail:'event'},
  'MES-TD3-016':{filters:['공장','설치 위치','장비 상태'],cols:['카메라ID','카메라명','공장','설치 위치','IP','장비 상태','모델 버전'],detail:'camera'},
  'MES-TD3-017':{filters:['공장','장비 상태','모델 버전'],cols:['카메라ID','카메라명','설치 위치','통신 상태','이벤트 수신','모델 상태','최종 확인시각']},
  'MES-TD3-018':{filters:['기간','카메라','이벤트 유형','확인 상태'],cols:['수신번호','수신일시','발생일시','외부 이벤트ID','카메라ID','이벤트 유형','스냅샷 수','확인 상태'],detail:'form'},
  'MES-TD3-019':{filters:['기간','공장','설비','경보 유형'],cols:['경보번호','발생일시','설비','경보 유형','발송 주체','발송 결과','확인자'],detail:'form'},
  'MES-TD3-020':{filters:['기간','장비 구분','장비','이벤트 유형'],cols:['장비ID','장비명','이벤트 건수','위험 건수','미조치','최종 발생일시']},
  'MES-TD3-021':{filters:['기간','공장','설비','이벤트 유형'],cols:['이벤트ID','발생일시','설비','이벤트 유형','위험 단계','점검 등록 여부','점검번호'],detail:'link'},
  'MES-TD3-022':{filters:['기간','장비 구분','장애 유형','처리 상태'],cols:['장애번호','발생일시','장비','위치','장애 유형','처리 상태','담당자','복구일시'],detail:'failure'},
}

const generic={filters:['기간','공장','설비','이벤트 유형','처리 상태'],cols:['이벤트ID','발생일시','공장','설비','위치','이벤트 유형','위험 단계','처리 상태']}

function Pill({value}){let t=value==='위험'||value==='미확인'?'red':value==='주의'||value==='조치중'?'amber':'green';return <span className={`pill ${t}`}>{value}</span>}

function Sidebar({current,onSelect,mobile,setMobile}){
  const [open,setOpen]=useState({['스마트 안전관리']:true,['AI CCTV 관리']:true,['시스템 관리']:true})
  return <><aside className={`sidebar ${mobile?'show':''}`}><div className="brand"><div className="mark">H</div><div><strong>HUGREEN</strong><span>SMART SAFETY</span></div></div><nav>{groups.map(g=><section key={g.name}><button className="group" onClick={()=>setOpen({...open,[g.name]:!open[g.name]})}><i>{g.icon}</i><b>{g.name}</b><em>{open[g.name]?'−':'+'}</em></button>{open[g.name]&&<div className="items">{g.items.map(([id,name])=><button key={id} className={current===id?'active':''} onClick={()=>{onSelect(id);setMobile(false)}}><span>{name}</span><small>{id.slice(-3)}</small></button>)}</div>}</section>)}</nav><div className="system"><i/><span>모든 시스템 정상</span><small>v1.4</small></div></aside>{mobile&&<button className="scrim" onClick={()=>setMobile(false)} aria-label="메뉴 닫기"/>}</>
}

function Header({name,setMobile}){return <header className="top"><button className="hamb" onClick={()=>setMobile(true)}>☰</button><div><small>휴그린 MES</small><b>{name}</b></div><div className="top-actions"><span className="connected"><i/>정상 연결</span><button className="alarm">♢<em>3</em></button><div className="profile"><b>이현균</b><small>관리자</small></div><button className="logout">로그아웃</button></div></header>}

function Tabs({tabs,current,setCurrent,closeTab}){return <div className="tabs">{tabs.map(id=>{const name=groups.flatMap(g=>g.items).find(x=>x[0]===id)?.[1];return <button className={current===id?'active':''} key={id} onClick={()=>setCurrent(id)}><span>{name}</span><em onClick={e=>{e.stopPropagation();closeTab(id)}}>×</em></button>})}</div>}

function Filters({items,onAction}){return <section className="filter-card">{items.map((f,i)=><label key={f}><span>{f}</span>{f==='기간'||f.includes('일자')?<div className="dates"><input type="date" defaultValue="2026-10-01"/><em>–</em><input type="date" defaultValue="2026-10-08"/></div>:<select defaultValue="all"><option value="all">전체</option><option>광주 1공장</option><option>정상</option></select>}</label>)}<button className="primary" onClick={()=>onAction('조회')}>조회</button></section>}

function cellValue(col,row,i){if(col.includes('이벤트ID'))return row.id;if(col.includes('일시')||col.includes('수신일'))return row.time;if(col==='공장')return row.plant;if(col.includes('설비')||col.includes('장비')||col.includes('카메라'))return row.equipment;if(col.includes('위치')||col==='구역')return row.location;if(col.includes('유형'))return row.type;if(col.includes('단계'))return <Pill value={row.level}/>;if(col.includes('상태')||col.includes('결과'))return <Pill value={row.status}/>;if(col.includes('번호')||col.includes('ID'))return `${col.slice(0,2).toUpperCase()}-000${i+1}`;if(col.includes('일'))return '2026-10-08';if(col.includes('담당')||col.includes('처리자')||col.includes('확인자'))return '안전관리팀';return '정상'}

const detailFields={
  event:['확인 상태','담당자 지정','조치 상태','조치 내용','완료일시','근거자료'],camera:['카메라ID','카메라명','설치 위치','IP 주소','감지구역','모델 버전'],
  sensor:['센서ID','센서명','센서 유형','공장','설치 설비','통신 방식','연결 PLC','PLC 입력주소'],inspection:['항목별 결과','승인자','승인일시','반려 사유'],
  failure:['장애 내용','확인자','원인','원인 구분','조치 내용','담당자','복구일시','비고'],link:['점검 문서 선택','자동 입력 항목','추가 점검 결과','조치 사항'],
}

function Details({type,row}){
  if(type==='snap')return <section className="detail snapshots"><div className="event-summary"><span>이벤트 상세</span><h3>{row.equipment} · {row.type}</h3><p>{row.time} · {row.location}</p><dl><div><dt>감지 신뢰도</dt><dd>97.4%</dd></div><div><dt>처리 상태</dt><dd><Pill value={row.status}/></dd></div></dl></div>{['감지 3초 전','감지 시점','감지 3초 후'].map((x,i)=><figure key={x}><div className={`camera c${i}`}><span>CAM 08</span><i/></div><figcaption>{x}</figcaption></figure>)}</section>
  if(type==='log')return <section className="detail log"><span>원본 메시지</span><code>{`{ "eventId": "${row.id}", "source": "AI_CCTV_08", "receivedAt": "${row.time}", "result": "SUCCESS" }`}</code></section>
  if(type==='tree')return <section className="detail tree"><div className="tree-nav"><b>정기 안전점검</b><span>└ 일상 점검</span><span>　└ 프레스 설비</span><span className="sel">　　└ 작업 전 점검</span></div><div className="tree-form"><h3>작업 전 점검</h3><label>점검 항목<input defaultValue="비상 정지 장치 작동 상태"/></label><label>입력 방식<select><option>적합 · 부적합</option></select></label></div></section>
  if(!type)return null
  const fields=detailFields[type]||['확인 상태','담당자','등록 사유','비고']
  return <section className="detail edit"><div className="detail-title"><span>상세 정보</span><h3>{row.id}</h3><small>목록에서 선택한 항목을 확인하거나 수정합니다.</small></div><div className="form-grid">{fields.map((f,i)=><label key={f}><span>{f}</span>{f.includes('내용')||f.includes('사유')||f==='비고'?<textarea defaultValue={i===0?'현장 확인 후 안전 조치 진행':''}/>:<input defaultValue={f.includes('상태')?row.status:f.includes('담당')?'안전관리팀':f.includes('위치')?row.location:''}/>}</label>)}</div></section>
}

function Screen({id,name}){
  const conf=specific[id]||generic
  const [selected,setSelected]=useState(0)
  const [toast,setToast]=useState('')
  const rows=useMemo(()=>eventRows,[])
  const action=x=>{setToast(`${x} 처리가 완료되었습니다.`);setTimeout(()=>setToast(''),1800)}
  return <main className="page"><div className="breadcrumb">홈 / {groups.find(g=>g.items.some(x=>x[0]===id))?.name} / <b>{name}</b></div><div className="title"><div><h1>{name}</h1><span>{id}</span></div><p>조건을 선택하여 데이터를 조회하고 관리합니다.</p></div><Filters items={conf.filters} onAction={action}/>
    <section className="data"><div className="data-tools"><span>조회 결과 <b>{rows.length}</b>건</span><div>{conf.approve&&<><button onClick={()=>action('승인')}>승인</button><button onClick={()=>action('반려')}>반려</button></>} {conf.detail&&<><button onClick={()=>action('추가')}>추가</button><button onClick={()=>action('저장')}>저장</button><button className="danger" onClick={()=>action('삭제')}>삭제</button></>}<button onClick={()=>action(conf.download?'영상 내려받기':'엑셀 다운로드')}>{conf.download?'내려받기':'엑셀'}</button></div></div><div className="table-wrap"><table><thead><tr>{conf.cols.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r,ri)=><tr key={r.id} className={selected===ri?'selected':''} onClick={()=>setSelected(ri)}>{conf.cols.map(c=><td key={c}>{cellValue(c,r,ri)}</td>)}</tr>)}</tbody></table></div><div className="pagination"><button>‹</button><b>1</b><button>2</button><button>3</button><button>›</button></div></section>
    <Details type={conf.detail} row={rows[selected]}/>{toast&&<div className="toast">✓ {toast}</div>}
  </main>
}

export default function App(){
  const [current,setCurrent]=useState('MES-TD3-015')
  const [tabs,setTabs]=useState(['MES-TD3-007','MES-TD3-015'])
  const [mobile,setMobile]=useState(false)
  const all=groups.flatMap(g=>g.items);const name=all.find(x=>x[0]===current)?.[1]
  const select=id=>{setCurrent(id);setTabs(t=>t.includes(id)?t:[...t,id].slice(-5))}
  const close=id=>{if(tabs.length===1)return;const next=tabs.filter(x=>x!==id);setTabs(next);if(current===id)setCurrent(next.at(-1))}
  return <div className="shell"><Sidebar current={current} onSelect={select} mobile={mobile} setMobile={setMobile}/><div className="workspace"><Header name={name} setMobile={setMobile}/><Tabs tabs={tabs} current={current} setCurrent={setCurrent} closeTab={close}/><Screen id={current} name={name}/></div></div>
}
