<template>
  <div style="padding:8px;">
    <!-- (optional) visible debug line so you can confirm message receipt -->
    <div style="font-size:12px; opacity:0.7;">Last msg ui: {{ lastUi }}</div>

    <v-dialog v-model="open" max-width="520" persistent>
      <v-card>
        <v-card-title class="text-h6" style="font-weight:900;">
          {{ title }}
        </v-card-title>

        <v-card-text style="white-space: pre-wrap;">
          {{ text }}
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey" @click="cancel()">
            {{ cancelText }}
          </v-btn>
          <v-btn variant="elevated" color="deep-purple" @click="confirm()">
            {{ confirmText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // dialog
      open: false,

      // debug
      lastUi: "(none)",

      // content
      id: null,
      title: "Confirm",
      text: "Are you sure?",
      confirmText: "Confirm",
      cancelText: "Cancel",
    };
  },

  mounted() {
    // EXACT same working pattern as your diagnostic test
    this.$watch(
      () => this.msg,
      (m) => {
        const p = m?.payload || {};
        this.lastUi = p.ui || "(none)";

        if (p.ui === "openConfirm") {
          this.id = p.id ?? null;
          this.title = p.title ?? "Confirm";
          this.text = p.text ?? "Are you sure?";
          this.confirmText = p.confirmText ?? "Confirm";
          this.cancelText = p.cancelText ?? "Cancel";
          this.open = true;
        }
      },
      { deep: true, immediate: true }
    );
  },

  methods: {
    confirm() {
      const id = this.id;
      this.open = false;
      this.send({ payload: { ui: "confirmResult", id, confirmed: true } });
    },
    cancel() {
      const id = this.id;
      this.open = false;
      this.send({ payload: { ui: "confirmResult", id, confirmed: false } });
    },
  },
};
</script>

<style>
.v-card-text { font-size: 14px; }
</style>