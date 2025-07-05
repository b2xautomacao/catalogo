-- Atualizar limite de imagens do plano básico de 5 para 10
UPDATE plan_features 
SET feature_value = '10'
WHERE plan_id = (SELECT id FROM subscription_plans WHERE type = 'basic')
  AND feature_type = 'max_images_per_product';

-- Verificar se a atualização foi aplicada
SELECT 
  sp.name as plan_name,
  pf.feature_type,
  pf.feature_value
FROM subscription_plans sp
JOIN plan_features pf ON pf.plan_id = sp.id
WHERE sp.type = 'basic' 
  AND pf.feature_type = 'max_images_per_product'; 