-- 수정 대상 확인 (먼저 실행하여 영향받는 레코드 확인)
SELECT id, commit_id, message, team_id, developer_id, created_at
FROM commits
WHERE developer_id = '4ab1044e-0149-464d-857e-bdd4b2b47190'
  AND team_id = 'ad3a29ff-f3d7-4bdd-8b67-1c40bd75381a';

-- team_id 수정
UPDATE commits
SET team_id = '93688103-d98e-4c34-9f22-f8e547bff6e9'
WHERE developer_id = '4ab1044e-0149-464d-857e-bdd4b2b47190'
  AND team_id = 'ad3a29ff-f3d7-4bdd-8b67-1c40bd75381a';