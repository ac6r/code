<template>
<div>
<Dialog
  :show="dialogConfig.show"
  :title="dialogConfig.title"
  :buttons="dialogConfig.buttons"
  width="400px"
  :showCancel="false"
  @close="dialogConfig.show = false"
>
  <el-form
    :model="formData"
    :rules="rules"
    ref="formDataRef"
    @submit.prevent
  >
    <el-form-item label="" prop="applyInfo">
      <el-input
        type="textarea"
        :rows="5"
        clearable
        placeholder="输入申请信息,更容易被通过"
        v-model.trim="formData.applyInfo"
        resize="none"
        show-word-limit
        maxlength="100"
      ></el-input>
    </el-form-item>
  </el-form>
</Dialog>
</div>
</template>
<script setup>
import Dialog from '../../components/Dialog.vue';
import { ref, getCurrentInstance } from 'vue';
import request from '../../utils/Request';
import api from '../../utils/Api.js';
import message from '../../utils/message';

const { proxy } = getCurrentInstance();
const emit = defineEmits(['success']);

const formData = ref({ applyInfo: '' });
const formDataRef = ref();
const targetData = ref(null);
const rules = {
  applyInfo: [{ required: false, trigger: 'blur' }]
};

const dialogConfig = ref({
  show: false,
  title: '提交申请',
  buttons: [{
    type: 'primary',
    text: '确定',
    click: async (e) => {
      await submitApply();
    }
  }]
});

// 提交申请的异步方法
const submitApply = async () => {
  try {
    // 表单校验
    await formDataRef.value.validate();
    
    // 构造请求参数
    const params = {
      targetId: targetData.value.contactId,
      applyInfo: formData.value.applyInfo,
      contactType: targetData.value.contactType
    };

    // 调用提交申请接口
    const result = await request({
      url: api.applyAdd,
      method: 'POST',
      params: params
    });

    if (result.code === 200) {
      // 提交成功，关闭弹窗
      dialogConfig.value.show = false;
      // 通知父组件提交成功
      emit('success');
      // 重置表单
      formData.value = { applyInfo: '' };
    } else {
      message.error(result.message || '提交失败，请重试');
    }
  } catch (err) {
    console.error('提交申请异常：', err);
    message.error('提交失败，请重试');
  }
};

const show = (data) => {
  targetData.value = data;
  dialogConfig.value.show = true;
  formData.value = { applyInfo: '你好，请求添加你为好友' };
};

defineExpose({
  show
});
</script>
