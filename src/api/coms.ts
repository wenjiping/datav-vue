import request from '@/utils/request'

export function getComs(projectId: number) {
  return request.get(`/coms?projectId=${projectId}`)
}

export function deleteCom(id: string) {
  return request.delete(`/coms/${id}`)
}

export function addCom(data: any) {
  return request.post('/coms', data)
}

export function copyCom(id: string) {
  return request.post(`/coms/${id}/copy`)
}
